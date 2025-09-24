"use client";

import React, { useState } from "react";
import { importEventProgressive, enhanceEventWithCategories, enhanceEventWithSummary, saveImportedEvent } from "@/app/actions/import-event";
import { normalizeEventUrl, getUrlFormatHelp } from '@/lib/url-utils';
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
  ChevronDown,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [categorizationProcessing, setCategorizationProcessing] = useState(false);
  const [summaryProcessing, setSummaryProcessing] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingInterestArea, setEditingInterestArea] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);

  // Accept any non-empty city input (AI has already gated via needs_city_confirmation)
  const isValidUKCity = (city: string) => !!(city && city.trim());

  const handleImport = async () => {
    if (!url.trim()) {
      setError("Please enter an event URL");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Normalize the URL to handle various input formats
      let normalizedUrl: string;
      try {
        normalizedUrl = normalizeEventUrl(url.trim());
      } catch (urlError) {
        setError(urlError instanceof Error ? urlError.message : getUrlFormatHelp(url.trim()));
        setLoading(false);
        return;
      }

      // Phase 1: Get basic event data (fast!)
      const result = await importEventProgressive(normalizedUrl, forceUpdate);

      if (result.success) {
        const successResult = result as { success: true; event: any; message?: string; aiProcessing?: boolean };
        setPreview(successResult.event);
        setSuccess(successResult.message || "Event imported successfully!");
        setLoading(false);

        // Phase 2: Staged AI enhancement (categorization first, then summary)
        if (successResult.aiProcessing) {
          // Stage 1: AI Categorization (faster)
          setCategorizationProcessing(true);
          try {
            const categoryResult = await enhanceEventWithCategories(successResult.event);
            if (categoryResult.success) {
              setPreview(categoryResult.event);
              setSuccess(categoryResult.message || "Event categorized! Summary in progress...");
              
              // Stage 2: AI Summary (slower)
              setCategorizationProcessing(false);
              setSummaryProcessing(true);
              
              try {
                const summaryResult = await enhanceEventWithSummary(categoryResult.event);
                if (summaryResult.success) {
                  setPreview(summaryResult.event);
                  setSuccess("Event imported with full AI analysis completed!");
                } else {
                  setSuccess("Event imported with categorization! Summary generation had issues.");
                }
              } catch (summaryError) {
                console.error("AI summary generation failed:", summaryError);
                setSuccess("Event imported with categorization! Summary generation failed.");
              } finally {
                setSummaryProcessing(false);
              }
            } else {
              setSuccess("Event imported! AI categorization had issues but basic data is available.");
              setCategorizationProcessing(false);
            }
          } catch (categoryError) {
            console.error("AI categorization failed:", categoryError);
            setSuccess("Event imported! AI categorization failed but basic data is available.");
            setCategorizationProcessing(false);
          }
        }
      } else {
        const errorResult = result as { success: false; error: string };
        setError(errorResult.error || "Failed to import event");
        setLoading(false);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;

    console.log('🎯 Starting save process for event:', preview.title);
    setSaving(true);
    setError("");

    try {
      console.log('📤 Calling saveImportedEvent with data:', {
        title: preview.title,
        ai_event_types: preview.ai_event_types,
        platform: preview.platform
      });
      
      const result = await saveImportedEvent(preview);
      
      console.log('📥 Save result:', result);

      if (result.success) {
        console.log('✅ Save successful, closing modal');
        setSuccess("Event saved successfully!");
        onEventImported();
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1500);
      } else {
        console.error('❌ Save failed:', result.error);
        setError(result.error || "Failed to save event");
      }
    } catch (error) {
      console.error('❌ Save exception:', error);
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
    setCategorizationProcessing(false);
    setSummaryProcessing(false);
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
                  Import and customize events from Luma, Humanitix, Partiful, and Eventbrite
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
                  Supports Luma, Humanitix, Partiful, and Eventbrite events
                </div>
                
                {/* Loading Progress Steps */}
                {(loading || categorizationProcessing || summaryProcessing) && (
                  <div className="flex items-center justify-between mb-4 text-xs">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                        loading ? 'border-[#AE3813] text-[#AE3813]' : 
                        preview ? 'border-green-500 text-green-500' : 'border-gray-600 text-gray-600'
                      }`}>
                        {preview ? <CheckCircle className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      </div>
                      <span className={
                        loading ? 'text-[#AE3813]' : 
                        preview ? 'text-green-500' : 'text-gray-600'
                      }>Fetching</span>
                    </div>
                    <div className={`h-[2px] flex-1 mx-2 mt-[-24px] ${
                      preview ? 'bg-green-500' : 
                      loading ? 'bg-gradient-to-r from-[#AE3813] to-[#D45E3C]' : 'bg-gray-700'
                    }`} />
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                        categorizationProcessing ? 'border-[#AE3813] text-[#AE3813] animate-pulse' : 
                        preview && preview.ai_categorized ? 'border-green-500 text-green-500' :
                        preview ? 'border-yellow-500 text-yellow-500' : 'border-gray-600 text-gray-600'
                      }`}>
                        {preview && preview.ai_categorized ? <CheckCircle className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                      </div>
                      <span className={
                        categorizationProcessing ? 'text-[#AE3813]' : 
                        preview && preview.ai_categorized ? 'text-green-500' :
                        preview ? 'text-yellow-500' : 'text-gray-600'
                      }>Categories</span>
                    </div>
                    <div className={`h-[2px] flex-1 mx-2 mt-[-24px] ${
                      preview && preview.ai_categorized ? 'bg-green-500' :
                      categorizationProcessing ? 'bg-gradient-to-r from-[#AE3813] to-[#D45E3C]' : 'bg-gray-700'
                    }`} />
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                        summaryProcessing ? 'border-[#AE3813] text-[#AE3813] animate-pulse' : 
                        preview && preview.ai_summarized ? 'border-green-500 text-green-500' :
                        preview && preview.ai_categorized ? 'border-yellow-500 text-yellow-500' : 'border-gray-600 text-gray-600'
                      }`}>
                        {preview && preview.ai_summarized ? <CheckCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                      </div>
                      <span className={
                        summaryProcessing ? 'text-[#AE3813]' : 
                        preview && preview.ai_summarized ? 'text-green-500' :
                        preview && preview.ai_categorized ? 'text-yellow-500' : 'text-gray-600'
                      }>Summary</span>
                    </div>
                    <div className={`h-[2px] flex-1 mx-2 mt-[-24px] ${
                      preview && preview.ai_summarized ? 'bg-green-500' :
                      summaryProcessing ? 'bg-gradient-to-r from-[#AE3813] to-[#D45E3C]' : 'bg-gray-700'
                    }`} />
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 ${
                        preview && preview.ai_summarized ? 'border-green-500 text-green-500' : 'border-gray-600 text-gray-600'
                      }`}>
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <span className={
                        preview && preview.ai_summarized ? 'text-green-500' : 'text-gray-600'
                      }>Ready</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      id="event-url"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste event URL here"
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
                        <span className="relative">
                          Importing
                          <span className="absolute -right-4 animate-[bounce_1.5s_infinite]">.</span>
                          <span className="absolute -right-7 animate-[bounce_1.5s_infinite_.2s]">.</span>
                          <span className="absolute -right-10 animate-[bounce_1.5s_infinite_.4s]">.</span>
                        </span>
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
                      {categorizationProcessing && (
                        <p className="text-blue-300 text-xs mt-1">
                          🎯 AI categorization in progress - you can review basic details below
                        </p>
                      )}
                      {summaryProcessing && (
                        <p className="text-blue-300 text-xs mt-1">
                          📝 AI summary generation in progress - categories complete!
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

                    {/* City (required if AI uncertain) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        City
                      </label>
                      {preview.needs_city_confirmation ? (
                        <div className="space-y-1">
                          <input
                            value={preview.city || ''}
                            onChange={(e) => updatePreview('city', e.target.value)}
                            placeholder="Enter UK city (e.g., Dundee)"
                            className="w-full bg-white/5 border border-red-500/50 rounded-lg px-4 py-3 text-primary-text placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                          />
                          <p className="text-xs text-red-400">City required. Please enter a UK city before saving.</p>
                        </div>
                      ) : (
                        <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text min-h-[44px] flex items-center">
                          {preview.city}
                        </div>
                      )}
                    </div>

                    {/* Venue/Location (display as-is) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Venue / Location
                      </label>
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text min-h-[44px] flex items-center">
                        {preview.location || 'TBD'}
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Organizer
                      </label>
                      <input
                        type="text"
                        value={preview.organizer || ''}
                        onChange={(e) => updatePreview("organizer", e.target.value)}
                        placeholder="Organising Team"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text placeholder-gray-400 focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200"
                      />
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
                    <div className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full ${
                      categorizationProcessing || summaryProcessing
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse' 
                        : 'bg-white/5 text-gray-400'
                    }`}>
                      <Sparkles className="w-3 h-3" />
                      {categorizationProcessing ? 'Categorizing...' : 
                       summaryProcessing ? 'Summarizing...' : 'AI-powered'}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Event Types (Multi-select) */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Event Types (max 2) {preview.ai_categorized && <span className="text-[#AE3813] text-xs ml-2">(AI suggested)</span>}
                      </label>
                      
                      {/* Selected Event Types Display */}
                      <div className="space-y-2">
                        {(preview.ai_event_types || []).length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(preview.ai_event_types || []).map((type: string, index: number) => (
                              <div
                                key={`${type}-${index}`}
                                className="flex items-center gap-2 bg-[#AE3813]/20 border border-[#AE3813]/40 rounded-full px-3 py-1 text-sm"
                              >
                                <span className="text-primary-text">{type}</span>
                                <button
                                  onClick={() => {
                                    const newTypes = (preview.ai_event_types || []).filter((_: string, i: number) => i !== index);
                                    updatePreview("ai_event_types", newTypes);
                                    // Also update legacy field
                                    updatePreview("ai_event_type", newTypes[0] || "Other");
                                  }}
                                  className="text-gray-400 hover:text-red-400 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">No event types selected</div>
                        )}
                      </div>

                      {/* Add Event Type Dropdown */}
                      {(!preview.ai_event_types || preview.ai_event_types.length < 2) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200 flex items-center justify-between hover:bg-white/10">
                              <span>Add event type...</span>
                              <Plus className="w-4 h-4 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-gray-900 border-gray-700">
                            {EVENT_TYPES.filter(type => !(preview.ai_event_types || []).includes(type)).map((type) => (
                              <DropdownMenuItem
                                key={type}
                                onClick={() => {
                                  const currentTypes = preview.ai_event_types || [];
                                  const newTypes = [...currentTypes, type];
                                  updatePreview("ai_event_types", newTypes);
                                  // Also update legacy field
                                  updatePreview("ai_event_type", newTypes[0] || "Other");
                                }}
                                className="text-primary-text hover:bg-white/10 cursor-pointer"
                              >
                                {type}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-primary-text focus:outline-none focus:border-[#AE3813] focus:ring-2 focus:ring-[#AE3813]/20 transition-all duration-200 flex items-center justify-between hover:bg-white/10">
                              <span className="text-left">
                                {editingInterestArea || "Select a research area to add..."}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-gray-900 border-gray-700 max-h-60 overflow-y-auto">
                            <DropdownMenuItem
                              onClick={() => setEditingInterestArea("")}
                              className="text-gray-400 hover:bg-white/10 cursor-pointer"
                            >
                              Select a research area to add...
                            </DropdownMenuItem>
                            {INTEREST_AREAS.filter(
                              (area) => !preview.ai_interest_areas?.includes(area)
                            ).map((area) => (
                              <DropdownMenuItem
                                key={area}
                                onClick={() => setEditingInterestArea(area)}
                                className="text-primary-text hover:bg-white/10 cursor-pointer"
                              >
                                {area}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

                    {/* Full Description - Hidden but still stored */}
                    <input 
                      type="hidden" 
                      value={preview.description} 
                    />
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
                  disabled={saving || (preview.needs_city_confirmation && !isValidUKCity(preview.city || ''))}
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
