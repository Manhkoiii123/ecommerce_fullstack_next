import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { message, chatHistory } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Fetch products from database for context
    const products = await db.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        brand: true,
        rating: true,
        numReviews: true,
        variants: {
          select: {
            id: true,
            variantName: true,
            slug: true,
            sizes: {
              select: {
                price: true,
                discount: true,
              },
              take: 1,
            },
          },
          take: 1,
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      where: {
        variants: {
          some: {
            sizes: {
              some: {
                quantity: {
                  gt: 0,
                },
              },
            },
          },
        },
      },
      orderBy: {
        rating: "desc",
      },
      take: 20, // Top 20 products
    });

    // Format products for AI context
    const productsContext = products
      .map((p) => {
        const variant = p.variants[0];
        const size = variant?.sizes[0];
        const price = size?.price || 0;
        const discount = size?.discount || 0;
        const finalPrice = price - (price * discount) / 100;

        return `- ${p.name} by ${p.brand} (${
          p.category.name
        }) - $${finalPrice.toFixed(2)} - Rating: ${p.rating}/5 (${
          p.numReviews
        } reviews) - URL: /product/${p.slug}/${variant?.slug}`;
      })
      .join("\n");

    // Build conversation context from history
    const messages = [
      {
        role: "system",
        content: `You are a helpful AI shopping assistant for an e-commerce website. 

Your responsibilities:
- Help customers find products from our catalog
- Answer questions about shipping, returns, and policies
- Provide product recommendations based on real products
- Assist with general shopping inquiries
- Be friendly, concise, and professional

**IMPORTANT PRODUCT RECOMMENDATIONS:**
When customers ask about products, ALWAYS recommend from this REAL product catalog:

${productsContext} 



Guidelines:
- Keep responses short (2-4 sentences)
- When recommending products, use this format: "Product Name ($price) - [View Product](/product-url)"
- You can recommend multiple products if relevant
- Mention key details like brand, price, rating
- If customer asks about specific features, match them with suitable products
- Use emojis sparingly to be friendly 😊
- If you're not sure, suggest browsing categories or contacting support`,
      },
    ];

    // Add chat history for context (last 10 messages)
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message,
    });

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API Error:", error);
      return NextResponse.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: aiResponse,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
