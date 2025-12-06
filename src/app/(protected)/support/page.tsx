"use client";

// import Image from "next/image";
import { MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Plus } from "lucide-react";
import { TextAnimate } from "@/components/ui/text-animate";
import { useState } from "react";
import OpenTicketFlow from "./_components/OpenTicketFlow";
import TicketList from "./_components/TicketList";
import TicketDetails from "./_components/TicketDetails";
import { TicketFormData } from "./_components/types";
import { Ticket } from "@/services/getTickets";
import {
  createTicket,
  TicketPriority,
  TicketStatus,
} from "@/services/createTicket";
import { toast } from "sonner";

export default function SupportHub() {
  // Get user data directly from Redux store
  const userData = useSelector((state: RootState) => state.user.data);
  
  // Use full user name from Redux state (check both name and accountname for compatibility)
  const userName = (userData as any)?.name || userData?.accountname || "User";

  const [loading, setLoading] = useState(false);
  const [openTicketMode, setOpenTicketMode] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const handleTicketSubmit = async (data: TicketFormData) => {
    setLoading(true);
    try {
      // Backend will handle parent_id and status from authenticated user
      const params = {
        title: data.subject,
        parent_id: "", // Not sent to backend
        status: "Open" as TicketStatus, // Not sent to backend
        priority: (data.priority.toLowerCase() as TicketPriority) || "normal",
        description: data.description,
        ticket_type: data.category,
        ...(data.account_number && { account_number: data.account_number }),
      };

      const response = await createTicket(params);
      toast.success(
        "Ticket created successfully! Ticket No: " + response.data.ticket_no
      );
    } catch (err) {
      console.log("Failed to create ticket:", err);
      toast.error("Failed to create ticket, please try again later");
    } finally {
      setLoading(false);
      setOpenTicketMode(false);
    }
  };

  if (openTicketMode) {
    return (
      <OpenTicketFlow
        onBack={() => setOpenTicketMode(false)}
        onSubmit={handleTicketSubmit}
        loading={loading}
      />
    );
  }

  if (selectedTicket) {
    return (
      <TicketDetails
        ticketId={selectedTicket}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  const openTawkToChat = () => {
    if (
      typeof window !== "undefined" &&
      window.Tawk_API &&
      typeof window.Tawk_API.showWidget === "function" &&
      typeof window.Tawk_API.maximize === "function"
    ) {
      // Show and maximize the chat widget
      window.Tawk_API.showWidget();
      window.Tawk_API.maximize();

      // Hide widget when chat is closed
      if (typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.onChatMinimized = function () {
          if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
            window.Tawk_API.hideWidget();
          }
        };
      }
    } else {
      console.error("Tawk.to chat is not loaded yet. Please wait a moment and try again.");
      // Optionally show a toast notification to the user
      toast.error("Chat is loading, please try again in a moment.");
    }
  };

  return (
    <div className="px-3 md:px-0 pb-6">
      {/* Header */}
      <TextAnimate
        as="h1"
        duration={0.2}
        className="mb-4 text-[34px] font-semibold dark:text-white/75"
      >
        Support hub
      </TextAnimate>
      

      {/* Help Section */}
      <section className="rounded-lg border-2 border-gray-300 dark:border-[#1D1825] dark:bg-gradient-to-r from-[#FFFFFF] to-[#f4e7f6] p-5 sm:p-7 dark:from-[#110F17] dark:to-[#1E1429]">
        {/* Header */}
        <h3 className="mb-4 text-xl sm:text-2xl font-semibold dark:text-white/75">
          Hello {userName}, how can we help you?
        </h3>
        <p className="text-sm sm:text-base dark:text-white/75">
          Your one-stop solution for all your needs. Find answers, troubleshoot
          issues, and explore guides.
        </p>

        {/* Search */}
        {/* <div className="relative max-w-4xl">
          <Input
            type="text"
            placeholder="Please enter your question or keyword..."
            className="h-12 pr-12 text-sm sm:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            size="sm"
            className="absolute right-1 top-1 h-10 w-10 bg-[#c5a3e9] text-black hover:bg-[#c5a3e9] "
          >
            <Search className="h-4 w-4" />
          </Button>
        </div> */}
      </section>

      {/* Contact Section */}
      <TextAnimate
        as="h3"
        duration={0.2}
        className="mb-4 mt-6 text-xl sm:text-2xl font-semibold dark:text-white/75"
      >
        Contact us
      </TextAnimate>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
        {/* Ticket Card */}
        <Card className="overflow-hidden dark:bg-[#120f18] py-0">
          {/* <div className="relative h-40 sm:h-48">
            <Image
              src={contact3}
              alt="Need assistance illustration"
              fill
              className="object-cover"
            />
          </div> */}
          <CardContent className="p-6">
            <h4 className="text-lg sm:text-xl dark:text-white/75 font-semibold mb-3">
              Need assistance?
            </h4>
            <p className="text-sm sm:text-base dark:text-white/75 mb-4">
              Complete the form and we will get back to you shortly.
            </p>
            <Button
              className="gap-1 w-full sm:w-auto bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white rounded-lg font-medium"
              onClick={() => setOpenTicketMode(true)}
            >
              <Plus className="w-3 h-3" />Open a ticket
            </Button>
          </CardContent>
        </Card>

        {/* Chat Card */}
        <Card className="overflow-hidden dark:bg-[#120f18] py-0">
          {/* <div className="relative h-40 sm:h-48">
            <Image
              src={contact1}
              alt="Live chat illustration"
              fill
              className="object-cover"
            />
          </div> */}
          <CardContent className="p-6">
            <h4 className="text-lg sm:text-xl dark:text-white/75 font-semibold mb-3">
              Live chat
            </h4>
            <p className="text-sm sm:text-base dark:text-white/75 mb-4">
              Can&apos;t find the answers? Chat with our Intelligent Assistant.
            </p>
            <Button
              variant="outline"
              className="w-full sm:w-auto font-medium border-2 bg-transparent"
              onClick={openTawkToChat}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Start chat
            </Button>
          </CardContent>
        </Card>

        {/* Phone Card */}
        <Card className="overflow-hidden dark:bg-[#120f18] py-0">
          {/* <div className="relative h-40 sm:h-48">
            <Image
              src={contact2}
              alt="Phone support illustration"
              fill
              className="object-cover"
            />
          </div> */}
          <CardContent className="p-6">
            <h4 className="text-lg sm:text-xl dark:text-white/75 font-semibold mb-3">
              Still need help?
            </h4>
            <p className="text-sm sm:text-base dark:text-white/75 mb-4">
              To speak with our support team, Email us at
            </p>
            <div className="space-y-2 text-sm sm:text-base">
              <div className="flex items-center dark:text-white/75">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@zuperior.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previous Tickets Section */}
      <TextAnimate
        as="h3"
        duration={0.2}
        className="mb-4 mt-8 text-xl sm:text-2xl font-semibold dark:text-white/75"
      >
        Your Tickets
      </TextAnimate>

      <TicketList
        selectedStatus={selectedStatus}
        searchQuery={searchQuery}
        onTicketClick={(ticket) => setSelectedTicket(ticket.id)}
      />
    </div>
  );
}
