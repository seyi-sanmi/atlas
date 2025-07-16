"use client";

import React, { useState } from "react";
import { importEvent, saveImportedEvent } from "@/app/actions/import-event";
import { X, Download, Save, AlertCircle, CheckCircle, Sparkles, Edit, Plus, Trash } from "lucide-react";
import { EVENT_TYPES, INTEREST_AREAS } from "@/lib/event-categorizer";

interface ImportEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventImported: () => void;
}

export function ImportEventModal({
  isOpen,
  onClose,
  onEventImported,
}: ImportEventModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingInterestArea, setEditingInterestArea] = useState("");

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter an event URL");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await importEvent(url.trim());

      if (result.success) {
        setPreview(result.event);
        setSuccess(result.message || "Event imported successfully!");
      } else {
        setError(result.error || "Failed to import event");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    setSaving(true);
    setError("");

    try {
      const result = await saveImportedEvent(preview);

      if (result.success) {
        setSuccess("Event saved successfully!");
        onEventImported();
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } else {
        setError(result.error || "Failed to save event");
      }
    } catch (error) {
      setError("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setUrl("");
    setPreview(null);
    setError("");
    setSuccess("");
    setLoading(false);
    setSaving(false);
    setEditingInterestArea("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updatePreview = (field: string, value: string | string[]) => {
    setPreview((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addInterestArea = () => {
    if (!editingInterestArea || !preview) return;
    const newAreas = [...(preview.ai_interest_areas || [])];
    if (!newAreas.includes(editingInterestArea)) {
      newAreas.push(editingInterestArea);
      updatePreview("ai_interest_areas", newAreas);
    }
    setEditingInterestArea("");
  };

  const removeInterestArea = (area: string) => {
    if (!preview) return;
    const newAreas = preview.ai_interest_areas.filter((a: string) => a !== area);
    updatePreview("ai_interest_areas", newAreas);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16">
      <div className="bg-secondary-bg border border-gray-800 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto mt-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-primary-text">
            Import Event
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-primary-text hover:bg-white/10 transition-all duration-200 p-2 rounded-md"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label
              htmlFor="event-url"
              className="block text-sm font-medium text-primary-text"
            >
              Event URL
            </label>
            <p className="text-sm text-gray-400 mb-3">
              Supports Luma (lu.ma) and Eventbrite events
            </p>
            <div className="flex gap-3">
              <input
                id="event-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://lu.ma/your-event or https://www.eventbrite.com/e/..."
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-primary-text placeholder-gray-400 focus:outline-none focus:border-[#AE3813] focus:ring-1 focus:ring-[#AE3813]"
                disabled={loading || saving}
              />
              <button
                onClick={handleImport}
                disabled={loading || saving || !url.trim()}
                className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 disabled:cursor-not-allowed text-primary-text px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-400 text-sm">{success}</p>
                {preview?.platform === "luma-scraped" && (
                  <p className="text-green-300 text-xs mt-1">
                    ✨ Data extracted using web scraping
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Event Preview */}
          {preview && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Name - Read Only */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Event Name
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text">
                    {preview.title}
                  </div>
                </div>

                {/* Date - Read Only */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Date
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text">
                    {preview.date}
                  </div>
                </div>

                {/* Time - Read Only */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Time
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text">
                    {preview.time}
                  </div>
                </div>

                {/* City - Read Only */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    City
                  </label>
                  <div className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text">
                    {preview.city}
                  </div>
                </div>
              </div>

              {/* AI-Generated Content */}
              <div className="space-y-4">
                {/* Event Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Event Type
                  </label>
                  <select
                    value={preview.ai_event_type}
                    onChange={(e) => updatePreview("ai_event_type", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text focus:outline-none focus:border-[#AE3813]"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Research Areas - Improved Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      Research Areas
                    </label>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Sparkles className="w-3 h-3" />
                      AI-suggested
                    </div>
                  </div>

                  {/* Selected Areas */}
                  <div className="min-h-[44px] flex flex-wrap gap-2 p-2 bg-white/5 border border-white/10 rounded-md">
                    {preview.ai_interest_areas?.map((area: string) => (
                      <div
                        key={area}
                        className="group bg-white/10 hover:bg-white/15 border border-white/10 rounded-full px-3 py-1.5 text-sm flex items-center gap-2 transition-colors"
                      >
                        <span className="text-primary-text/80">{area}</span>
                        <button
                          onClick={() => removeInterestArea(area)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Area Control */}
                  <div className="flex gap-2">
                    <select
                      value={editingInterestArea}
                      onChange={(e) => setEditingInterestArea(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text focus:outline-none focus:border-[#AE3813]"
                    >
                      <option value="">Add a research area...</option>
                      {INTEREST_AREAS.filter(
                        (area) => !preview.ai_interest_areas?.includes(area)
                      ).map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={addInterestArea}
                      disabled={!editingInterestArea}
                      className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 disabled:cursor-not-allowed text-primary-text px-4 rounded-md font-medium transition-all duration-200 flex items-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">
                      AI-Generated Summary
                    </label>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Sparkles className="w-3 h-3" />
                      AI-generated
                    </div>
                  </div>
                  <textarea
                    value={preview.ai_summary}
                    onChange={(e) => updatePreview("ai_summary", e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text placeholder-gray-400 focus:outline-none focus:border-[#AE3813]"
                  />
                </div>

                {/* Full Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Full Description
                  </label>
                  <textarea
                    value={preview.description}
                    onChange={(e) => updatePreview("description", e.target.value)}
                    rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-primary-text placeholder-gray-400 focus:outline-none focus:border-[#AE3813]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {preview && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-800">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-400 hover:text-primary-text"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 text-primary-text px-6 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Event
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
