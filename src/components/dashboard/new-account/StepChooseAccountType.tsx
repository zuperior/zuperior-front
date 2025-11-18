import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { DialogTitle } from "../../ui/dialog";
import { AccountTypeCard } from "./accountTypeCard";
import { groupManagementService } from "@/services/api.service";

interface Group {
  id: number;
  group: string;
  dedicated_name: string | null;
  account_type: string | null;
  leverage: number | null;
  min_deposit: number | null;
  spread: number | null;
  commission: number | null;
  is_active: boolean;
}

interface StepChooseAccountTypeProps {
  accountPlan: string | Group | null;
  setAccountPlan: (plan: Group | null) => void;
  accountType: string; // "Live" or "Demo"
  setAccountType: (type: string) => void;
  nextStep: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  isDragging: boolean;
  handleScrollLeft: () => void;
  handleScrollRight: () => void;
  arrowMaskStyle: React.CSSProperties;
}

export const StepChooseAccountType: React.FC<StepChooseAccountTypeProps> = ({
  accountPlan,
  setAccountPlan,
  accountType,
  setAccountType,
  nextStep,
  scrollRef,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  isDragging,
  handleScrollLeft,
  handleScrollRight,
  arrowMaskStyle,
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active groups based on account type
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching active groups for account type:', accountType);
        const response = await groupManagementService.getActiveGroups(accountType);
        console.log('✅ Active Groups Response:', response);
        
        if (response.success && response.data) {
          console.log('✅ Groups received:', response.data);
          console.log('✅ First group leverage:', response.data[0]?.leverage);
          setGroups(response.data);
        } else {
          console.error('❌ Invalid response format:', response);
          setGroups([]);
        }
      } catch (error) {
        console.error('❌ Error fetching active groups:', error);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    if (accountType) {
      fetchGroups();
    }
  }, [accountType]);

  // Check if a group is selected
  const isGroupSelected = (group: Group): boolean => {
    if (!accountPlan || typeof accountPlan === 'string') return false;
    return (accountPlan as Group).id === group.id;
  };

  return (
    <div className="w-full relative">
      <DialogTitle className="text-[20px] md:text-[28px] font-bold text-center text-black dark:text-white/75 tracking-tighter leading-11">
        Choose account type
      </DialogTitle>
      <div className="space-y-6 mt-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-sm text-gray-500">Loading account types...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-sm text-gray-500">No account types available</p>
          </div>
        ) : (
          <div className="relative w-full flex justify-center">
            <div className="flex space-x-4 w-full md:w-[540px] flex-wrap justify-center">
              {groups.map((group) => {
                // Determine user role based on dedicated_name or group name
                const isPro = group.dedicated_name?.toLowerCase().includes('pro') || 
                             group.group.toLowerCase().includes('pro');
                const userRole = isPro ? "For Experts" : "For Beginners";
                const title = group.dedicated_name || group.group.split('\\').pop() || "Account";

                return (
                  <AccountTypeCard
                    key={group.id}
                    userRole={userRole}
                    title={title}
                    selected={isGroupSelected(group)}
                    onClick={() => {
                      setAccountPlan(group);
                      // Update accountType to match the selected group's account_type
                      if (group.account_type) {
                        setAccountType(group.account_type);
                      }
                    }}
                    leverage={group.leverage !== null && group.leverage !== undefined ? Number(group.leverage) : null}
                    minDeposit={group.min_deposit ? Number(group.min_deposit) : null}
                    spread={group.spread ? Number(group.spread) : null}
                    commission={group.commission ? Number(group.commission) : null}
                    description={null}
                  />
                );
              })}
            </div>
          </div>
        )}
        <Button
          className="bg-gradient-to-tr from-[#6242a5] to-[#9f8bcf] cursor-pointer mb-1 text-white w-full font-semibold text-xs leading-[14px] py-2 items-center flex justify-center"
          onClick={nextStep}
          disabled={!accountPlan || loading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
