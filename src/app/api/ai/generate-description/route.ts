import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productName, type } = await req.json();

    if (!productName) {
      return NextResponse.json(
        { error: "Product name is required" },
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

    // Determine the prompt based on description type
    const prompt =
      type === "variant"
        ? `Write a detailed product variant description for "${productName}". Focus on specific features and characteristics that make this variant unique. Write in HTML format with proper paragraphs and bullet points. Make it engaging and informative. Keep it between 150-300 words.`
        : `Write a compelling and detailed product description for "${productName}". Focus on key features, benefits, and what makes it special. Write in HTML format with proper paragraphs and bullet points. Make it SEO-friendly and engaging. Keep it between 200-400 words.`;

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
          messages: [
            {
              role: "system",
              content:
                "You are a professional e-commerce product description writer. Write engaging, SEO-friendly descriptions in HTML format.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Groq API Error:", error);
      return NextResponse.json(
        { error: "Failed to generate description" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const description = data.choices[0]?.message?.content;

    if (!description) {
      return NextResponse.json(
        { error: "No description generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
