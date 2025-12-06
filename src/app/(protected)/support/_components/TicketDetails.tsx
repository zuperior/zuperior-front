"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  Send,
  User,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getTicketById,
  TicketWithReplies,
  addTicketReply,
} from "@/services/getTickets";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TicketDetailsProps {
  ticketId: number;
  onBack: () => void;
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

export default function TicketDetails({ ticketId, onBack }: TicketDetailsProps) {
  const [ticket, setTicket] = useState<TicketWithReplies | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const data = await getTicketById(ticketId);
      setTicket(data);
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      await addTicketReply(ticketId, { content: replyContent });
      toast.success("Reply added successfully");
      setReplyContent("");
      fetchTicket();
    } catch (error: any) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="gap-2 text-gray-700 dark:text-gray-300 hover:text-[#6242a5] dark:hover:text-[#9f8bcf] hover:bg-gray-100 dark:hover:bg-[#1D1825]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Button>
      </div>

      {/* Ticket Info */}
      <Card className="border dark:border-[#1D1825] dark:bg-gradient-to-r from-[#1A1420] to-[#1E1429]">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Status, Ticket ID, Priority */}
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
              <CardTitle className="text-xl dark:text-white/75 text-gray-900">
                {ticket.title}
              </CardTitle>
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>Created {format(parseISO(ticket.created_at), "MMM dd, yyyy")}</span>
                </div>
                {ticket.last_reply_at && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>Last reply {format(parseISO(ticket.last_reply_at), "MMM dd")}</span>
                  </div>
                )}
              </div>
              
              {/* Account Number */}
              {ticket.account_number && (
                <Badge 
                  variant="secondary"
                  className="text-xs bg-gradient-to-r from-[#6242a5]/20 to-[#9f8bcf]/20 border border-[#6242a5]/30 text-[#6242a5] dark:text-[#9f8bcf] font-medium w-fit"
                >
                  Account: {ticket.account_number}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {ticket.description && (
          <CardContent>
            <p className="text-sm whitespace-pre-wrap dark:text-white/75 text-gray-700 dark:text-gray-300">
              {ticket.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold dark:text-white/75">
          Replies ({ticket.replies?.length || 0})
        </h3>

        <div className="space-y-3">
          {ticket.replies && ticket.replies.length > 0 ? (
            ticket.replies.map((reply) => (
              <Card 
                key={reply.id}
                className="border dark:border-[#1D1825] dark:bg-gradient-to-r from-[#1A1420] to-[#1E1429]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-gradient-to-r from-[#6242a5]/20 to-[#9f8bcf]/20 p-2.5 flex-shrink-0">
                      <User className="h-4 w-4 text-[#6242a5] dark:text-[#9f8bcf]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-semibold dark:text-white/75 text-gray-900">
                          {reply.sender_name}
                        </span>

                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                          {format(parseISO(reply.created_at), "MMM dd, yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap dark:text-white/75 text-gray-700 dark:text-gray-300 leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No replies yet. Be the first to respond!
            </div>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {ticket.status !== "Closed" && (
        <Card className="border dark:border-[#1D1825] dark:bg-gradient-to-r from-[#1A1420] to-[#1E1429]">
          <CardHeader>
            <CardTitle className="text-lg dark:text-white/75 text-gray-900">Add Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <Textarea
                placeholder="Type your reply here..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={5}
                className="bg-white dark:bg-[#120f18] border-gray-300 dark:border-[#1D1825] focus:border-[#6242a5] dark:focus:border-[#6242a5]"
              />
              <Button 
                type="submit" 
                disabled={submittingReply || !replyContent.trim()}
                className="bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:from-[#7242b5] hover:to-[#af8bdf] disabled:opacity-50"
              >
                {submittingReply ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

