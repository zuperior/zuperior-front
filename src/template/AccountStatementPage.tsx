import React from "react";
import EmailFooter from "./common/EmailFooter";
import Bar from "../../assets/emails/R-Chart Bar.svg"
import EmailHeader from "./common/EmailHeader";
interface AccountStatementPageProps {
  userName?: string;
  statementPeriod?: string;
  startDate?: string;
  endDate?: string;
  companyName?: string;
}

const AccountStatementPage: React.FC<AccountStatementPageProps> = ({
  // userName = "[Name]",
  statementPeriod = "[Daily/Weekly/Monthly]",
  startDate = "[Start Date]",
  endDate = "[End Date]",
  companyName = "[Company Name]",
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
        bellImage={Bar}
        heading=""
        subHeading={`Your ${statementPeriod} Account Statement`}
        Title="If you have any questions or need further assistance, please contact our support team."
        subTitle=
        {`Please find attached your ${statementPeriod} account statement for the period ${startDate} to ${endDate}. It includes all transactions, balances, and relevant details for your review.`}
        text={`Thank you for choosing ${companyName}.`}
      />

      {/* Footer */}
      <EmailFooter
        title="Discover all the exclusive features and benefits waiting for you inside."
        buttonText="GET STARTED"
      />
    </div>
  );
};

export default AccountStatementPage;
