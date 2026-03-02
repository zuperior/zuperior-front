"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { toast } from "sonner";
import EyeIcon from "@/components/EyeIcon";
import Link from "next/link";
import axios from "axios";

import loginScreenOne from "@/assets/login/login-screen-one.png";
import loginScreenTwo from "@/assets/login/login-screen-two.png";
import loginScreenThree from "@/assets/login/login-screen-three.png";

import "swiper/css";
import "swiper/css/pagination";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const images = [
    { id: 1, src: loginScreenOne },
    { id: 2, src: loginScreenTwo },
    { id: 3, src: loginScreenThree },
  ];

  useEffect(() => {
    // Check if user is already authenticated
    const userToken = localStorage.getItem('userToken');
    const clientId = localStorage.getItem('clientId');

    if (userToken && clientId) {
      router.replace("/");
      return;
    }

    if (!token) {
      toast.error("Invalid reset link. Please request a new password reset.");
      router.push("/login");
    }
  }, [token, router]);

  const getInputClassName = (fieldName: string) =>
    `w-full bg-[#1a1a1a] p-3 rounded text-white text-sm focus:outline-none ${validationErrors[fieldName]
      ? "border border-red-500/50 bg-red-500/5 shadow-lg shadow-red-500/20"
      : "border border-transparent focus:border-purple-500/50 focus:shadow-lg focus:shadow-purple-500/20"
    }`;

  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !token) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post(
        "/api/auth/reset-password",
        {
          token: token,
          newPassword: newPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        toast.success(response.data.message || "Password reset successfully! You can now login.");
        // Redirect to login page after successful reset
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast.error(response.data?.message || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to reset password. The link may have expired.";
      toast.error(errorMessage);

      // If token is invalid/expired, redirect to login
      if (error.response?.status === 400 || error.response?.status === 404) {
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="flex h-[700px] lg:w-[900px] w-full items-center justify-center mx-auto">
        {/* Image Carousel - Desktop Only */}
        <div className="hidden lg:flex w-1/2 items-center justify-center relative">
          <Swiper
            pagination={{ clickable: true }}
            modules={[Pagination, Autoplay]}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            loop={true}
            className="mySwiper"
          >
            {images.map((image) => (
              <SwiperSlide key={image.id} className="w-full">
                <Image
                  src={image.src}
                  alt="Zuperior"
                  className="h-[650px] w-[450px] object-cover rounded-xl"
                />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="absolute z-20 text-white text-3xl font-semibold px-8 top-12">
            <p>Think Superior,</p>
            <p>Trade Zuperior</p>
          </div>
        </div>

        {/* Reset Password Form */}
        <div className="flex-1 text-white bg-black flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
              <p className="text-gray-400 text-sm">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    className={`${getInputClassName("newPassword")} pr-10`}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearFieldError("newPassword");
                    }}
                    disabled={isLoading}
                    minLength={6}
                    aria-invalid={!!validationErrors.newPassword}
                    aria-describedby={
                      validationErrors.newPassword ? "newPassword-error" : undefined
                    }
                  />
                  <EyeIcon
                    visible={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
                {validationErrors.newPassword && (
                  <p
                    id="newPassword-error"
                    className="text-red-400 text-xs mt-1 animate-pulse"
                    role="alert"
                  >
                    {validationErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className={`${getInputClassName("confirmPassword")} pr-10`}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError("confirmPassword");
                    }}
                    disabled={isLoading}
                    minLength={6}
                    aria-invalid={!!validationErrors.confirmPassword}
                    aria-describedby={
                      validationErrors.confirmPassword
                        ? "confirmPassword-error"
                        : undefined
                    }
                  />
                  <EyeIcon
                    visible={showConfirmPassword}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                </div>
                {validationErrors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="text-red-400 text-xs mt-1 animate-pulse"
                    role="alert"
                  >
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] cursor-pointer text-white p-3 rounded mt-2 flex items-center justify-center disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-7 w-7"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <defs>
                      <linearGradient
                        id="loader-gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#a259ff" />
                        <stop offset="100%" stopColor="#6a3fd9" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="url(#loader-gradient)"
                      strokeWidth="4"
                      fill="none"
                      opacity="0.3"
                    />
                    <path
                      d="M12 2 a10 10 0 0 1 0 20 a10 10 0 0 1 0-20"
                      stroke="url(#loader-gradient)"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="40"
                      strokeDashoffset="10"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 12 12"
                        to="360 12 12"
                        dur="1s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition-colors"
              >
                Back to Login
              </Link>
            </div>

            {/* Info Message */}
            <div className="mt-6 rounded-lg bg-[#1a1a1a] border border-purple-500/20 p-4">
              <p className="text-xs text-gray-400">
                <strong className="text-purple-400">Note:</strong> This password reset link expires in 1 hour.
                If your link has expired, please request a new one from the login page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
