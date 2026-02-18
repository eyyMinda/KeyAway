/** @fileoverview Featured program settings component for admin. Manages rotation schedule, auto-select criteria, and current featured program selection. */

"use client";

import { useEffect, useState, useMemo } from "react";
import { client } from "@/src/sanity/lib/client";
import { featuredProgramSettingsQuery } from "@/src/lib/queries";
import { IdealImage } from "@/src/components/general/IdealImage";
import { getWorkingKeysCount } from "@/src/lib/adminHelpers";
import type { Program } from "@/src/types/program";

interface FeaturedProgramSettingsData {
  _id?: string;
  currentFeaturedProgram?: {
    _id: string;
    title: string;
    slug: { current: string };
    description?: string;
    featuredDescription?: string;
    image?: { asset: { _ref: string } };
    showcaseGif?: { asset: { _ref: string } };
    cdKeys?: Array<{ status: string }>;
  };
  rotationSchedule?: "weekly" | "biweekly" | "monthly";
  lastRotationDate?: string;
  autoSelectCriteria?: "highest_working_keys" | "most_popular" | "random";
}

interface FeaturedProgramSettingsProps {
  programs: Program[];
  onProgramClick: (program: Program | null) => void;
}

export default function FeaturedProgramSettings({ programs, onProgramClick }: FeaturedProgramSettingsProps) {
  const [settings, setSettings] = useState<FeaturedProgramSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProgramSelect, setShowProgramSelect] = useState(false);
  const [localRotationSchedule, setLocalRotationSchedule] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [localAutoSelectCriteria, setLocalAutoSelectCriteria] = useState<
    "highest_working_keys" | "most_popular" | "random"
  >("highest_working_keys");
  const [localFeaturedProgramId, setLocalFeaturedProgramId] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: FeaturedProgramSettingsData | null = await client.fetch(featuredProgramSettingsQuery);
      setSettings(data);
      if (data) {
        setLocalRotationSchedule(data.rotationSchedule || "weekly");
        setLocalAutoSelectCriteria(data.autoSelectCriteria || "highest_working_keys");
        setLocalFeaturedProgramId(data.currentFeaturedProgram?._id || null);
      }
    } catch (err) {
      console.error("Error fetching featured program settings:", err);
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const hasChanges = useMemo(() => {
    if (!settings) return false;
    return (
      localRotationSchedule !== (settings.rotationSchedule || "weekly") ||
      localAutoSelectCriteria !== (settings.autoSelectCriteria || "highest_working_keys") ||
      localFeaturedProgramId !== (settings.currentFeaturedProgram?._id || null)
    );
  }, [localRotationSchedule, localAutoSelectCriteria, localFeaturedProgramId, settings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: {
        rotationSchedule?: "weekly" | "biweekly" | "monthly";
        autoSelectCriteria?: "highest_working_keys" | "most_popular" | "random";
        currentFeaturedProgramId?: string | null;
      } = {};

      if (localRotationSchedule !== (settings?.rotationSchedule || "weekly")) {
        payload.rotationSchedule = localRotationSchedule;
      }
      if (localAutoSelectCriteria !== (settings?.autoSelectCriteria || "highest_working_keys")) {
        payload.autoSelectCriteria = localAutoSelectCriteria;
      }
      if (localFeaturedProgramId !== (settings?.currentFeaturedProgram?._id || null)) {
        payload.currentFeaturedProgramId = localFeaturedProgramId;
      }

      if (Object.keys(payload).length === 0) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/admin/featured-program-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to update settings");
        return;
      }

      await fetchSettings();
      setShowProgramSelect(false);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      setLocalRotationSchedule(settings.rotationSchedule || "weekly");
      setLocalAutoSelectCriteria(settings.autoSelectCriteria || "highest_working_keys");
      setLocalFeaturedProgramId(settings.currentFeaturedProgram?._id || null);
    }
    setShowProgramSelect(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Featured Program Settings</h3>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rotation Schedule</label>
            <select
              value={localRotationSchedule}
              onChange={e => setLocalRotationSchedule(e.target.value as "weekly" | "biweekly" | "monthly")}
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm cursor-pointer disabled:opacity-50">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Select Criteria</label>
            <select
              value={localAutoSelectCriteria}
              onChange={e =>
                setLocalAutoSelectCriteria(e.target.value as "highest_working_keys" | "most_popular" | "random")
              }
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm cursor-pointer disabled:opacity-50">
              <option value="highest_working_keys">Highest Working Keys</option>
              <option value="most_popular">Most Popular</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Current Featured Program</label>
            <button
              type="button"
              onClick={() => setShowProgramSelect(!showProgramSelect)}
              disabled={saving}
              className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {showProgramSelect ? "Cancel" : "Change"}
            </button>
          </div>
          {showProgramSelect ? (
            <div className="border border-gray-300 rounded-lg p-2 bg-white max-h-48 overflow-y-auto">
              <select
                value={localFeaturedProgramId || ""}
                onChange={e => setLocalFeaturedProgramId(e.target.value || null)}
                disabled={saving}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 cursor-pointer disabled:opacity-50">
                <option value="">Select a program...</option>
                {programs.map(program => (
                  <option key={program._id ?? program.slug.current} value={program._id ?? ""}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            (() => {
              const featuredProgram = programs.find(p => p._id === localFeaturedProgramId);
              if (!featuredProgram) {
                return (
                  <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm bg-gray-50">
                    No featured program set
                  </div>
                );
              }
              return (
                <div
                  onClick={() => onProgramClick(featuredProgram)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-gray-50">
                  <div className="flex items-start gap-3">
                    {featuredProgram.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <IdealImage
                          image={featuredProgram.image}
                          alt={featuredProgram.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{featuredProgram.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {getWorkingKeysCount(featuredProgram.cdKeys)} working keys
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Click to edit</p>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {hasChanges && (
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-200">
          {settings?.lastRotationDate && (
            <div className="text-sm text-gray-600 order-2 sm:order-1">
              <span className="font-medium">Last Rotation:</span> {new Date(settings.lastRotationDate).toLocaleString()}
            </div>
          )}
          <div className="flex gap-3 order-1 sm:order-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
      {!hasChanges && settings?.lastRotationDate && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Last Rotation:</span> {new Date(settings.lastRotationDate).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
