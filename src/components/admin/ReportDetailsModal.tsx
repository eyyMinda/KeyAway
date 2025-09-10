"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ExpiredKeyReport } from "@/src/types";
import ModalSection from "./ModalSection";
import { FiAlertTriangle } from "react-icons/fi";

interface ReportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ExpiredKeyReport | null;
}

export default function ReportDetailsModal({ isOpen, onClose, report }: ReportDetailsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !report) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-primary-800 border border-blue-200";
      case "active":
        return "bg-green-100 text-green-800 border border-green-200";
      case "limit":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "expired":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col transform transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-95"
        }`}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between py-2 px-6 border-b-2 border-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-3xl font-bold text-black mb-2">Report Details</h2>
            <p className="text-primary-700 font-medium text-lg">{report.programTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-red-200 transition-colors p-3 rounded-full hover:bg-red-500 hover:bg-opacity-20">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Key Information */}
          <ModalSection title="Key Information" color="blue">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-semibold text-blue-700 mb-2 block">CD Key</label>
                <code className="flex items-center w-max text-sm font-mono bg-white text-gray-900 px-4 py-3 rounded-lg border border-blue-200 shadow-sm">
                  {report.key}
                </code>
              </div>
              <div>
                <label className="text-sm font-semibold text-blue-700 mb-2 block">Status</label>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(report.status)}`}>
                  {report.status}
                </span>
              </div>
              <div>
                <label className="text-sm font-semibold text-blue-700 mb-2 block">Key Hash</label>
                <code className="block text-xs font-mono text-gray-600 bg-white px-3 py-2 rounded border border-blue-200">
                  {report.keyHash}
                </code>
              </div>
              <div>
                <label className="text-sm font-semibold text-blue-700 mb-2 block">Key Identifier</label>
                <code className="block text-xs font-mono text-gray-600 bg-white px-3 py-2 rounded border border-blue-200">
                  {report.keyIdentifier}
                </code>
              </div>
            </div>
          </ModalSection>

          {/* Validity Information */}
          {(report.validFrom || report.validTo) && (
            <ModalSection title="Validity Period" color="green">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {report.validFrom && (
                  <div>
                    <label className="text-sm font-semibold text-green-700 mb-2 block">Valid From</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-green-200">
                      {new Date(report.validFrom).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {report.validTo && (
                  <div>
                    <label className="text-sm font-semibold text-green-700 mb-2 block">Valid Until</label>
                    <p className="text-sm text-gray-900 bg-white px-3 py-2 rounded border border-green-200">
                      {new Date(report.validTo).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </ModalSection>
          )}

          {/* Report Summary */}
          <ModalSection title="Report Summary" color="red">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center bg-white rounded-lg p-4 border border-red-200">
                <div className="text-2xl font-bold text-gray-800 mb-1">{report.reportCount}</div>
                <div className="text-xs font-semibold text-gray-900">Total Reports</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-green-200">
                <div className="text-2xl font-bold text-green-600 mb-1">{report.reportData.working}</div>
                <div className="text-xs font-semibold text-green-700">Working</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-red-200">
                <div className="text-2xl font-bold text-red-600 mb-1">{report.reportData.expired}</div>
                <div className="text-xs font-semibold text-red-700">Expired</div>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-orange-200">
                <div className="text-2xl font-bold text-orange-600 mb-1">{report.reportData.limit_reached}</div>
                <div className="text-xs font-semibold text-orange-700">Limit Reached</div>
              </div>
            </div>

            {/* Recommended Status */}
            {report.reportCount > 10 && report.reportData.working / report.reportCount <= 0.2 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <FiAlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <div>
                    <div className="text-sm font-semibold text-yellow-800">Recommended Status:</div>
                    <div className="text-sm text-yellow-700">
                      {report.reportData.expired >= report.reportData.limit_reached ? "Expired" : "Limit Reached"}
                      <span className="ml-1 text-xs">
                        (
                        {Math.round(
                          ((report.reportData.expired + report.reportData.limit_reached) / report.reportCount) * 100
                        )}
                        % of reports)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-900 font-medium">{formatDate(report.firstReported)}</div>
                <div className="text-xs text-gray-600 font-semibold">First Reported</div>
              </div>
              <div className="text-center bg-white rounded-lg p-3 border border-gray-200">
                <div className="text-sm text-gray-900 font-medium">{formatDate(report.lastReported)}</div>
                <div className="text-xs text-gray-600 font-semibold">Last Reported</div>
              </div>
            </div>
          </ModalSection>

          {/* Individual Reports */}
          <ModalSection title={`Individual Reports (${report.reports.length})`} color="purple">
            <div className="space-y-3">
              {report.reports.map((reportItem, index) => {
                const getEventTypeColor = (eventType: string) => {
                  switch (eventType) {
                    case "report_key_working":
                      return {
                        bg: "bg-gradient-to-r from-green-50 to-emerald-50",
                        border: "border-green-100",
                        text: "text-green-700",
                        badge: "bg-green-100 text-green-800 border-green-200",
                        icon: "✓"
                      };
                    case "report_key_expired":
                      return {
                        bg: "bg-gradient-to-r from-red-50 to-rose-50",
                        border: "border-red-100",
                        text: "text-red-700",
                        badge: "bg-red-100 text-red-800 border-red-200",
                        icon: "❌"
                      };
                    case "report_key_limit_reached":
                      return {
                        bg: "bg-gradient-to-r from-orange-50 to-amber-50",
                        border: "border-orange-100",
                        text: "text-orange-700",
                        badge: "bg-orange-100 text-orange-800 border-orange-200",
                        icon: "⚠"
                      };
                    default:
                      return {
                        bg: "bg-gradient-to-r from-gray-50 to-slate-50",
                        border: "border-gray-100",
                        text: "text-gray-700",
                        badge: "bg-gray-100 text-gray-800 border-gray-200",
                        icon: "?"
                      };
                  }
                };

                const colors = getEventTypeColor(reportItem.eventType);
                const eventTypeLabels = {
                  report_key_working: "Working",
                  report_key_expired: "Expired",
                  report_key_limit_reached: "Limit Reached"
                };

                return (
                  <div
                    key={index}
                    className={`${colors.bg} rounded-lg p-4 border ${colors.border} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{colors.icon}</span>
                        <div className={`text-sm font-semibold ${colors.text}`}>
                          {eventTypeLabels[reportItem.eventType as keyof typeof eventTypeLabels] ||
                            reportItem.eventType}
                        </div>
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded border ${colors.badge}`}>
                        {formatDate(reportItem.createdAt)}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className={`${colors.text} font-medium`}>Location:</span>
                      <span className="ml-2 text-gray-900 font-medium">
                        {reportItem.city}, {reportItem.country}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ModalSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-2 px-6 border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <div className="text-sm text-gray-600 font-medium">
            {report.reportCount} total reports • Last updated: {new Date(report.lastReported).toLocaleDateString()}
          </div>
          <button
            onClick={onClose}
            className="px-8 py-3 text-base font-bold text-white bg-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
