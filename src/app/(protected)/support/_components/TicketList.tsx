"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { getTickets, Ticket } from "@/services/getTickets";
import { CardLoader } from "@/components/ui/loading";

interface TicketListProps {
  selectedStatus: string;
  searchQuery: string;
  onTicketClick?: (ticket: Ticket) => void;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  New: { bg: "bg-blue-600", text: "text-white" },
  "Under Review": { bg: "bg-yellow-500", text: "text-white" },
  "Action Required": { bg: "bg-orange-500", text: "text-white" },
  "Escalated to provider": { bg: "bg-purple-600", text: "text-white" },
  Reopened: { bg: "bg-red-500", text: "text-white" },
  "Solution Provided": { bg: "bg-green-500", text: "text-white" },
  Closed: { bg: "bg-gray-500", text: "text-white" },
  Open: { bg: "bg-blue-600", text: "text-white" },
};

const priorityColors: Record<string, string> = {
  low: "bg-green-500",
  normal: "bg-gray-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export default function TicketList({
  selectedStatus,
  searchQuery,
  onTicketClick,
}: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, searchQuery]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStatus !== "All") params.status = selectedStatus;
      if (searchQuery) params.search = searchQuery;

      const data = await getTickets(params);
      setTickets(data);
    } catch (error: any) {
      console.error("Error fetching tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <CardLoader message="Loading your tickets..." />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gradient-to-r from-[#6242a5]/10 to-[#9f8bcf]/10 p-4 mb-4">
          <MessageSquare className="h-10 w-10 text-[#6242a5] dark:text-[#9f8bcf]" />
        </div>
        <p className="text-lg font-semibold dark:text-white/75 text-gray-900 mb-1">
          You don't have any tickets
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {selectedStatus !== "All" || searchQuery
            ? "No tickets match your filters. Try adjusting your search criteria."
            : "Create a new ticket above to get started with support."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Card
          key={ticket.id}
          className="cursor-pointer border dark:border-[#1D1825] dark:bg-gradient-to-r from-[#1A1420] to-[#1E1429] transition-all hover:border-[#6242a5]/50 hover:shadow-lg"
          onClick={() => onTicketClick?.(ticket)}
        >
          <CardContent className="p-6">
            <div className="space-y-3">
              {/* Top Row: Status, Ticket ID, Priority Dot */}
              <div className="flex items-center gap-3">
                <Badge
                  className={`${statusColors[ticket.status]?.bg} ${statusColors[ticket.status]?.text} border-0 text-xs font-medium px-2.5 py-1 h-6`}
                >
                  {ticket.status}
                </Badge>
                <span className="text-sm font-mono text-gray-400 dark:text-gray-500">
                  {ticket.ticket_no}
                </span>
                <div
                  className={`h-2 w-2 rounded-full ${priorityColors[ticket.priority]}`}
                  title={`Priority: ${ticket.priority}`}
                />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold dark:text-white/75 text-gray-900">
                {ticket.title}
              </h3>

              {/* Description */}
              {ticket.description && (
                <p className="text-sm text-muted-foreground dark:text-gray-400 line-clamp-2">
                  {ticket.description}
                </p>
              )}

              {/* Bottom Row: Date and Account Number */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{format(parseISO(ticket.created_at), "MMM dd, yyyy")}</span>
                </div>
                {ticket.account_number && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs bg-gradient-to-r from-[#6242a5]/20 to-[#9f8bcf]/20 border border-[#6242a5]/30 text-[#6242a5] dark:text-[#9f8bcf] font-medium"
                  >
                    {ticket.account_number}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

