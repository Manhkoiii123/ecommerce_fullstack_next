export async function sendNewStorePendingNotification(
  storeId: string,
  userId: string,
  storeName: string
) {
  if (typeof window === "undefined") {
    return { success: true, method: "database" };
  }

  try {
    const response = await fetch(`/api/socket/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "NEW_STORE_PENDING",
        storeId,
        userId,
        storeName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send notification:", errorText);
      return { success: false, error: errorText };
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending new store pending notification:", error);
    return { success: false, error };
  }
}

export async function sendStoreApprovedNotification(
  storeId: string,
  userId: string,
  storeName: string
) {
  if (typeof window === "undefined") {
    return { success: true, method: "database" };
  }

  try {
    const response = await fetch(`/api/socket/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "STORE_APPROVED",
        storeId,
        userId,
        storeName,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to send notification:", errorText);
      return { success: false, error: errorText };
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending store approved notification:", error);
    return { success: false, error };
  }
}
