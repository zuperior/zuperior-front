import React from "react";
import EmailHeader from "./common/EmailHeader";
import EmailFooter from "./common/EmailFooter";
import Success from "../../assets/emails/Image 34@4x 1.svg";

interface WithdrawalSuccessfulPageProps {
  userName?: string;
  amount?: string;
}

const WithdrawalSuccessfulPage: React.FC<WithdrawalSuccessfulPageProps> = ({
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
        bellImage={Success}
        heading="Congratulations!"
        subHeading="Withdrawal Successful"
        Title=""
        subTitle={`Your withdrawal request of ${amount} has been processed successfully and the funds have been transferred to your account.`}
        text="Thank you for your patience."
      />

      {/* Footer */}
      <EmailFooter
        title="Discover all the exclusive features and benefits waiting for you inside."
        buttonText="Get Started"
      />
    </div>
  );
};

export default WithdrawalSuccessfulPage;
