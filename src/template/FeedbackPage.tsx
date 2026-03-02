import React from "react";
import EmailHeader from "./common/EmailHeader";
import EmailFooter from "./common/EmailFooter";
import ChatBubble from "../../assets/emails/R-Chat Bubbles.svg";

interface FeedbackPageProps {
  userName?: string;
  companyName?: string;
}

const FeedbackPage: React.FC<FeedbackPageProps> = ({
  userName = "[Name]",
  companyName = "[Company/Product/Service]",
}) => {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "linear-gradient(to bottom, #000000 0%, #261933 100%)",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        color: "white",
      }}
    >
      {/* Header */}
      <EmailHeader
        bellImage={ChatBubble}
        heading=""
        subHeading="We'd Love Your Feedback"
        HiName={`Hi ${userName},`}
        subTitle={`We hope you had a great experience with ${companyName}! Your feedback is important to us and helps us improve.`}
        Title="Please take a moment to share your thoughts by clicking the link below:"
        text=""
      />

      {/* Footer */}
      <EmailFooter
        title="hank you for your time and support!"
        buttonText="SURVEY LINK"
      />
    </div>
  );
};

export default FeedbackPage;
