"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  BookOpen,
  Image,
  Eye,
  EyeOff,
  Save,
  X,
  GripVertical,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  getAllHeroContent,
  createHeroContent,
  updateHeroContent,
  deleteHeroContent,
  toggleHeroContentActive,
  HeroContent,
} from "@/lib/hero-content";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  item?: HeroContent | null;
  type: "research_area" | "location";
}

function EditModal({ isOpen, onClose, onSave, item, type }: EditModalProps) {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setImageUrl(item.image_url || "");
      setDisplayOrder(item.display_order);
      setIsActive(item.is_active);
    } else {
      setName("");
      setImageUrl("");
      setDisplayOrder(0);
      setIsActive(true);
    }
  }, [item, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        image_url: imageUrl.trim() || undefined,
        display_order: displayOrder,
        is_active: isActive,
        type,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {item ? "Edit" : "Add"}{" "}
            {type === "research_area" ? "Research Area" : "Location"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder={
                type === "research_area"
                  ? "e.g. Artificial Intelligence"
                  : "e.g. London"
              }
            />
          </div>

          {type === "location" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="isActive"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Active (visible on website)
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-border/90 border-t-white rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminHeroPage() {
  const [content, setContent] = useState<HeroContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editItem, setEditItem] = useState<HeroContent | null>(null);
  const [editType, setEditType] = useState<"research_area" | "location">(
    "research_area"
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getAllHeroContent();
      setContent(data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to load hero content" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = (type: "research_area" | "location") => {
    setEditItem(null);
    setEditType(type);
    setEditModal(true);
  };

  const handleEdit = (item: HeroContent) => {
    setEditItem(item);
    setEditType(item.type);
    setEditModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (editItem) {
        await updateHeroContent(editItem.id, data);
        setMessage({ type: "success", text: "Item updated successfully" });
      } else {
        await createHeroContent(data);
        setMessage({ type: "success", text: "Item created successfully" });
      }
      await loadContent();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save item" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      setActionLoading(id);
      await deleteHeroContent(id);
      setMessage({ type: "success", text: "Item deleted successfully" });
      await loadContent();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete item" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      setActionLoading(id);
      await toggleHeroContentActive(id, !isActive);
      await loadContent();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update item status" });
    } finally {
      setActionLoading(null);
    }
  };

  const researchAreas = content.filter((item) => item.type === "research_area");
  const locations = content.filter((item) => item.type === "location");

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hero Content Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage research areas and locations that appear in hero sections
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading hero content...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Research Areas */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Research Areas
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({researchAreas.filter((item) => item.is_active).length}{" "}
                  active)
                </span>
              </div>
              <button
                onClick={() => handleCreate("research_area")}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Area
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {researchAreas.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No research areas yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {researchAreas.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </span>
                            {!item.is_active && (
                              <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Order: {item.display_order}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleToggleActive(item.id, item.is_active)
                            }
                            disabled={actionLoading === item.id}
                            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            title={item.is_active ? "Hide" : "Show"}
                          >
                            {item.is_active ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={actionLoading === item.id}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="xl:col-span-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Locations
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({locations.filter((item) => item.is_active).length} active)
                </span>
              </div>
              <button
                onClick={() => handleCreate("location")}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {locations.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No locations yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {locations.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </span>
                              {!item.is_active && (
                                <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 px-2 py-0.5 rounded">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Order: {item.display_order}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleToggleActive(item.id, item.is_active)
                            }
                            disabled={actionLoading === item.id}
                            className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                            title={item.is_active ? "Hide" : "Show"}
                          >
                            {item.is_active ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            disabled={actionLoading === item.id}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        onSave={handleSave}
        item={editItem}
        type={editType}
      />
    </div>
  );
}
