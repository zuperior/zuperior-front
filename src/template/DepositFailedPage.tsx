import React from "react";
import EmailHeader from "./common/EmailHeader";
import EmailFooter from "./common/EmailFooter";
import cross from "../../assets/emails/R-Close Square (2).svg";
interface DepositFailedPageProps {
  userName?: string;
  amount?: string;
}

const DepositFailedPage: React.FC<DepositFailedPageProps> = ({
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
      {/* Header with custom bell icon showing X/error */}
      <EmailHeader
        bellImage={cross}
        heading=""
        subHeading="Deposit Failed"
        Title="We apologize for any inconvenience caused."
        subTitle={`Unfortunately, your deposit of ${amount} was not successful. Please try again or contact support for assistance.`}
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

export default DepositFailedPage;
