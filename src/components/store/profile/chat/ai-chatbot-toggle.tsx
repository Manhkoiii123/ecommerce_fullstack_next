"use client";

import { Bot, BotOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIChatbotToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export default function AIChatbotToggle({
  isEnabled,
  onToggle,
}: AIChatbotToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onToggle}
            variant={isEnabled ? "default" : "outline"}
            size="sm"
            className={`gap-2 ${
              isEnabled
                ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                : ""
            }`}
          >
            {isEnabled ? (
              <>
                <Bot className="w-4 h-4" />
                AI Support ON
              </>
            ) : (
              <>
                <BotOff className="w-4 h-4" />
                AI Support OFF
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isEnabled
              ? "AI will auto-respond to customer messages"
              : "Enable AI auto-response"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
