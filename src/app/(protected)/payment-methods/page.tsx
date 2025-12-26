"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { formatDate, getStatusColor } from "@/utils/formDate";
import { Copy } from "lucide-react";

interface PaymentMethod {
  id: string;
  methodType?: 'crypto' | 'bank';
  // Crypto
  address?: string;
  currency: string;
  network: string;
  // Bank
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscSwiftCode?: string;
  accountType?: string;
  // Common
  status: string;
  submittedAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      currency: "USDT",
      network: "TRC-20",
      address: "",
    },
  });

  const bankForm = useForm({
    defaultValues: {
      methodType: 'bank',
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifscSwiftCode: '',
      accountType: '',
    },
  });

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${API_URL}/user/payment-methods`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === "Success") {
        setPaymentMethods(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch payment methods");
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const onSubmit = async (values: { currency: string; network: string; address: string }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${API_URL}/user/payment-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ ...values, methodType: 'crypto' }),
      });
      const data = await response.json();
      if (data.status === "Success") {
        toast.success("Payment method submitted for approval");
        form.reset();
        fetchPaymentMethods();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to submit payment method");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitBank = async (values: {
    methodType: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscSwiftCode: string;
    accountType: string;
  }) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${API_URL}/user/payment-methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (data.status === "Success") {
        toast.success("Bank details submitted for approval");
        bankForm.reset();
        fetchPaymentMethods();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to submit bank details");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const cryptoMethods = paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'crypto');
  const bankMethods = paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'bank');

  return (
    <div className="flex flex-col p-4 min-h-screen">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-black dark:text-white">Payment Methods</h1>
          </div>

          {/* Add New Wallet Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Add Crypto Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/75 dark:text-gray-300">Wallet Currency</FormLabel>
                          <FormControl>
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-transparent">
                              <span className="text-black/50 dark:text-gray-400 mr-2">🪙</span>
                              <Input
                                {...field}
                                value="USDT"
                                disabled
                                className="bg-transparent border-none text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="network"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/75 dark:text-gray-300">Network Type</FormLabel>
                          <FormControl>
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-transparent">
                              <span className="text-black/50 dark:text-gray-400 mr-2">🔗</span>
                              <Input
                                {...field}
                                value="TRC-20"
                                disabled
                                className="bg-transparent border-none text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address"
                    rules={{
                      required: "Wallet address is required",
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black/75 dark:text-gray-300">Wallet Address</FormLabel>
                        <FormControl>
                          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-transparent">
                            <span className="text-black/50 dark:text-gray-400 mr-2">📝</span>
                            <Input
                              {...field}
                              placeholder="Enter wallet address"
                              className="bg-transparent border-none text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-6 py-2 rounded-md"
                    >
                      {loading ? "Submitting..." : "Submit for Review"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Saved Wallets Table */}
          <div className="rounded-[15px] bg-white dark:bg-gradient-to-r dark:from-[#15101d] dark:to-[#181422] border border-gray-200 dark:border-none p-3">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-black dark:text-white">Saved Crypto Wallets</h2>
            </div>

            {paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'crypto').length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No wallet added</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="overflow-x-auto rounded-b-xl w-full hidden xl:block" style={{ maxHeight: "550px", overflowY: "auto" }}>
                  <table className="w-full text-sm table-fixed">
                    <thead className="sticky top-0 bg-white dark:bg-[#01040D] z-10 border-b border-gray-200 dark:border-white/10 w-full">
                      <tr className="text-xs font-semibold leading-3.5 text-gray-700 dark:text-white/25">
                        <th className="text-left px-4 py-3 w-[8%]">#</th>
                        <th className="text-left px-4 py-3 w-[12%]">Currency</th>
                        <th className="text-left px-4 py-3 w-[15%]">Network</th>
                        <th className="text-left px-4 py-3 w-[35%]">Address</th>
                        <th className="text-left px-4 py-3 w-[15%]">Submitted Date</th>
                        <th className="text-center px-4 py-3 w-[10%]">Status</th>
                        <th className="text-center px-4 py-3 w-[5%]">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent">
                      {paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'crypto').map((method, index) => (
                        <tr key={method.id} className="text-sm leading-6.5 text-gray-800 dark:text-white/75 whitespace-nowrap font-semibold border-b border-gray-200 dark:border-[#9F8ACF]/10">
                          <td className="px-4 py-[15px]">{index + 1}</td>
                          <td className="px-4 py-[15px]">{method.currency}</td>
                          <td className="px-4 py-[15px]">{method.network}</td>
                          <td className="px-4 py-[15px] font-mono text-xs">{method.address}</td>
                          <td className="px-4 py-[15px]">{formatDate(method.submittedAt)}</td>
                          <td className={`px-4 py-[15px] text-center ${getStatusColor(method.status)}`}>
                            {method.status}
                          </td>
                          <td className="px-4 py-[15px] text-center">
                            <Button
                              onClick={() => copyAddress(method.address || '')}
                              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-2 py-1 rounded text-xs"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="w-full bg-white dark:bg-gradient-to-r dark:from-[#15101d] dark:to-[#181422] rounded-xl px-5 shadow-lg block xl:hidden">
                  {paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'crypto').map((method, index) => (
                    <div key={method.id} className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 py-3 last:border-none">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-black dark:text-white">#{index + 1}</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{method.currency}</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{method.network}</span>
                        </div>
                        <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-1 break-all">{method.address}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(method.submittedAt)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(method.status)}`}>
                          {method.status}
                        </span>
                        <Button
                          onClick={() => copyAddress(method.address || '')}
                          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-2 py-1 rounded text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Add Bank Details Card */}
          <Card className="mb-6 mt-8">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Add Bank Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...bankForm}>
                <form onSubmit={bankForm.handleSubmit(onSubmitBank)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={bankForm.control}
                      name="bankName"
                      rules={{ required: 'Bank Name is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/75 dark:text-gray-300">Bank Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter bank name" className="bg-transparent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountName"
                      rules={{ required: 'Account Name is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/75 dark:text-gray-300">Account Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter account holder name" className="bg-transparent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountNumber"
                      rules={{ required: 'Account Number is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/75 dark:text-gray-300">Account Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter account number" className="bg-transparent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="ifscSwiftCode"
                      rules={{ required: 'IFSC / SWIFT Code is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/75 dark:text-gray-300">IFSC / SWIFT Code</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter IFSC or SWIFT" className="bg-transparent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bankForm.control}
                      name="accountType"
                      rules={{ required: 'Account Type is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black/75 dark:text-gray-300">Account Type</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Savings, Current" className="bg-transparent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-6 py-2 rounded-md">
                      {loading ? "Submitting..." : "Submit for Review"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Saved Bank Details Table */}
          <div className="rounded-[15px] bg-white dark:bg-gradient-to-r dark:from-[#15101d] dark:to-[#181422] border border-gray-200 dark:border-none p-3">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-black dark:text-white">Saved Bank Details</h2>
            </div>

            {paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'bank').length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No bank details added</p>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="overflow-x-auto rounded-b-xl w-full hidden xl:block" style={{ maxHeight: "550px", overflowY: "auto" }}>
                  <table className="w-full text-sm table-fixed">
                    <thead className="sticky top-0 bg-white dark:bg-[#01040D] z-10 border-b border-gray-200 dark:border-white/10 w-full">
                      <tr className="text-xs font-semibold leading-3.5 text-gray-700 dark:text-white/25">
                        <th className="text-left px-4 py-3 w-[5%]">#</th>
                        <th className="text-left px-4 py-3 w-[15%]">Bank Name</th>
                        <th className="text-left px-4 py-3 w-[15%]">Account Name</th>
                        <th className="text-left px-4 py-3 w-[15%]">Account Number</th>
                        <th className="text-left px-4 py-3 w-[15%]">IFSC/SWIFT</th>
                        <th className="text-left px-4 py-3 w-[10%]">Type</th>
                        <th className="text-center px-4 py-3 w-[10%]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent">
                      {paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'bank').map((method, index) => (
                        <tr key={method.id} className="text-sm leading-6.5 text-gray-800 dark:text-white/75 font-semibold border-b border-gray-200 dark:border-[#9F8ACF]/10">
                          <td className="px-4 py-[15px] whitespace-nowrap">{index + 1}</td>
                          <td className="px-4 py-[15px] break-words word-break break-all">{method.bankName}</td>
                          <td className="px-4 py-[15px] whitespace-nowrap">{method.accountName}</td>
                          <td className="px-4 py-[15px] whitespace-nowrap">{method.accountNumber}</td>
                          <td className="px-4 py-[15px] whitespace-nowrap">{method.ifscSwiftCode}</td>
                          <td className="px-4 py-[15px] whitespace-nowrap">{method.accountType}</td>
                          <td className={`px-4 py-[15px] text-center whitespace-nowrap ${getStatusColor(method.status)}`}>{method.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="w-full bg-white dark:bg-gradient-to-r dark:from-[#15101d] dark:to-[#181422] rounded-xl px-5 shadow-lg block xl:hidden">
                  {paymentMethods.filter(pm => (pm.methodType ?? 'crypto') === 'bank').map((method, index) => (
                    <div key={method.id} className="flex justify-between items-center border-b border-gray-200 dark:border-white/10 py-3 last:border-none">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-black dark:text-white">#{index + 1}</span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{method.bankName}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 break-all">{method.accountName} • {method.accountNumber}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{method.ifscSwiftCode} • {method.accountType}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(method.status)}`}>
                          {method.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
