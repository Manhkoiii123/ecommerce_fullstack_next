"use client";

import { useState } from "react";
import FloatingChatButton from "./floating-chat-button";
import ChatPopup from "./chat-popup";

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <FloatingChatButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      <ChatPopup isOpen={isOpen} />
    </>
  );
}
