import React from "react";
import EmailHeader from "./common/EmailHeader";
import EmailFooter from "./common/EmailFooter";
import Cross from "../../assets/emails/R-Close Square (2).svg";

interface WithdrawalRejectedPageProps {
  userName?: string;
  amount?: string;
}

const WithdrawalRejectedPage: React.FC<WithdrawalRejectedPageProps> = ({
  // userName = "[Name]",
  amount = "[Amount]",
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
        bellImage={Cross}
        heading=""
        subHeading="Withdrawal Request Rejected"
        Title="We apologize for the inconvenience."
        subTitle={`Your withdrawal request of ${amount} could not be processed and has been rejected. Please check your account details or contact support for assistance.`}
        text="- Zuperior Team"
      />

      {/* Footer */}
      <EmailFooter
        title="Discover all the exclusive features and benefits waiting for you inside."
        buttonText="GET STARTED"
      />
    </div>
  );
};

export default WithdrawalRejectedPage;
