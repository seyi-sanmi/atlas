"use client";

import React, { useState } from "react";
import { importEvent, saveImportedEvent } from "@/app/actions/import-event";
import {
  X,
  Download,
  Save,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Edit,
  Plus,
  Trash,
  Link,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Tag,
} from "lucide-react";
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
    const newAreas = preview.ai_interest_areas.filter(
      (a: string) => a !== area
    );
    updatePreview("ai_interest_areas", newAreas);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-8">
      <div className="bg-secondary-bg border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-primary-text">
                  Import Event
                </h2>
                <p className="text-sm text-gray-400">
                  Import and customize events from Luma and Eventbrite
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-primary-text hover:bg-white/10 transition-all duration-200 p-2 rounded-lg"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
            <div
              className={`h-full bg-gradient-to-r from-[#AE3813] to-[#D45E3C] transition-all duration-500 ${
                preview ? "w-full" : url ? "w-1/3" : "w-0"
              }`}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Step 1: URL Import Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full flex items-center justify-center text-white text-sm font-medium">
                  1
                </div>
                <h3 className="text-lg font-medium text-primary-text">
                  Import Event URL
                </h3>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                  Supports Luma (lu.ma) and Eventbrite events
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      id="event-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://lu.ma/your-event or https://www.eventbrite.com/e/..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pl-11 text-primary-text placeholder-gray-400 focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200"
                      disabled={loading || saving}
                    />
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={loading || saving || !url.trim()}
                    className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 disabled:cursor-not-allowed text-primary-text px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-border/90 border-t-white rounded-full animate-spin" />
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
            </div>

            {/* Status Messages */}
            {(error || success) && (
              <div className="space-y-3">
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
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
              </div>
            )}

            {/* Step 2: Event Preview & Edit */}
            {preview && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    2
                  </div>
                  <h3 className="text-lg font-medium text-primary-text">
                    Review & Customize Event
                  </h3>
                </div>

                {/* Basic Event Information */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <h4 className="text-md font-medium text-primary-text">
                      Event Details
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Event Name
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text min-h-[44px] flex items-center">
                        {preview.title}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text min-h-[44px] flex items-center">
                        {preview.date}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text min-h-[44px] flex items-center">
                        {preview.time}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text min-h-[44px] flex items-center">
                        {preview.city}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI-Enhanced Content */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#AE3813]" />
                      <h4 className="text-md font-medium text-primary-text">
                        AI-Enhanced Content
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      AI-powered
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Event Type */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Event Type
                      </label>
                      <select
                        value={preview.ai_event_type}
                        onChange={(e) =>
                          updatePreview("ai_event_type", e.target.value)
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200"
                      >
                        {EVENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Research Areas */}
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-300">
                        Research Areas
                      </label>

                      {/* Selected Areas Display */}
                      <div className="min-h-[60px] bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex flex-wrap gap-2">
                          {preview.ai_interest_areas?.length > 0 ? (
                            preview.ai_interest_areas.map((area: string) => (
                              <div
                                key={area}
                                className="group bg-gradient-to-r from-[#AE3813]/20 to-[#D45E3C]/20 border border-[#AE3813]/30 rounded-full px-4 py-2 text-sm flex items-center gap-2 transition-all duration-200 hover:from-[#AE3813]/30 hover:to-[#D45E3C]/30"
                              >
                                <span className="text-primary-text">
                                  {area}
                                </span>
                                <button
                                  onClick={() => removeInterestArea(area)}
                                  className="opacity-70 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">
                              No research areas selected
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Add Research Area */}
                      <div className="flex gap-3">
                        <select
                          value={editingInterestArea}
                          onChange={(e) =>
                            setEditingInterestArea(e.target.value)
                          }
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200"
                        >
                          <option value="">
                            Select a research area to add...
                          </option>
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
                          className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 disabled:cursor-not-allowed text-primary-text px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* AI Summary */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        AI Summary
                      </label>
                      <textarea
                        value={preview.ai_summary}
                        onChange={(e) =>
                          updatePreview("ai_summary", e.target.value)
                        }
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text placeholder-gray-400 focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200 resize-none"
                        placeholder="AI-generated event summary..."
                      />
                    </div>

                    {/* Full Description */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Full Description
                      </label>
                      <textarea
                        value={preview.description}
                        onChange={(e) =>
                          updatePreview("description", e.target.value)
                        }
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text placeholder-gray-400 focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200 resize-none"
                        placeholder="Complete event description..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {preview && (
          <div className="border-t border-gray-800 bg-gray-900/30 p-6 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Ready to save your imported event?
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 text-gray-400 hover:text-primary-text hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 text-primary-text px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-border/90 border-t-white rounded-full animate-spin" />
                      Saving Event...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
