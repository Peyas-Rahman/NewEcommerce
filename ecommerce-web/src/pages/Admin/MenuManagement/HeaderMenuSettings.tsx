import { useEffect, useState } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Check,
  Loader2,
  RefreshCw,
  Save,
  Settings,
  X,
} from "lucide-react";

import {
  getHeaderMenuSettings,
  updateHeaderMenuSettings,
} from "../../../services/menuService";

import type { HeaderMenuSetting } from "../../../services/menuService";


export default function HeaderMenuSettings() {

  const [settings, setSettings] =
    useState<HeaderMenuSetting | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /* ============================================================
     LOAD SETTINGS
  ============================================================ */

  const loadSettings = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getHeaderMenuSettings();

      setSettings(data);

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Failed to load header menu settings."
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadSettings();

  }, []);


  /* ============================================================
     UPDATE LOCAL VALUE
  ============================================================ */

  const updateValue = <
    K extends keyof HeaderMenuSetting
  >(
    field: K,
    value: HeaderMenuSetting[K]
  ) => {

    setSettings((previous) => {

      if (!previous) return previous;

      return {
        ...previous,
        [field]: value,
      };

    });

  };


  /* ============================================================
     SAVE SETTINGS
  ============================================================ */

  const handleSave = async () => {

    if (!settings) return;

    try {

      setSaving(true);
      setError("");
      setSuccess("");

      await updateHeaderMenuSettings({

        alignment:
          settings.alignment,

        spacing:
          settings.spacing,

        showAllCategories:
          settings.showAllCategories,

        showDeals:
          settings.showDeals,

        isSticky:
          settings.isSticky,

        isActive:
          settings.isActive,

      });

      setSuccess(
        "Header menu settings updated successfully."
      );

      setTimeout(() => {

        setSuccess("");

      }, 3000);

    } catch (err: any) {

      console.error(err);

      setError(
        err?.response?.data?.message ||
        "Failed to update header menu settings."
      );

    } finally {

      setSaving(false);

    }
  };


  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {

    return (

      <div className="flex min-h-[500px] items-center justify-center bg-[#f5f7fa]">

        <div className="flex items-center gap-3 text-sm text-slate-500">

          <Loader2
            size={20}
            className="animate-spin"
          />

          Loading header settings...

        </div>

      </div>

    );

  }


  /* ============================================================
     ERROR / NO DATA
  ============================================================ */

  if (!settings) {

    return (

      <div className="min-h-screen bg-[#f5f7fa] p-6">

        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-red-50 p-6">

          <div className="flex items-center justify-between">

            <p className="text-sm font-medium text-red-700">

              {error ||
                "Header settings could not be loaded."}

            </p>

            <button
              type="button"
              onClick={loadSettings}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >

              <RefreshCw size={15} />

              Retry

            </button>

          </div>

        </div>

      </div>

    );

  }


  /* ============================================================
     UI
  ============================================================ */

  return (

    <div className="min-h-screen bg-[#f5f7fa]">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6b00] text-white">

                <Settings size={21} />

              </div>

              <div>

                <h1 className="text-2xl font-bold text-slate-900">

                  Header Menu Settings

                </h1>

                <p className="mt-1 text-sm text-slate-500">

                  Control the appearance and behaviour of your website header menu.

                </p>

              </div>

            </div>


            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >

              <RefreshCw size={16} />

              Refresh

            </button>

          </div>

        </div>

      </div>


      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-5xl px-5 py-7 lg:px-8">


        {/* SUCCESS */}

        {success && (

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">

            <Check size={18} />

            {success}

          </div>

        )}


        {/* ERROR */}

        {error && (

          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
            >

              <X size={17} />

            </button>

          </div>

        )}


        {/* ====================================================
            ALIGNMENT
        ==================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="font-bold text-slate-900">

              Menu Alignment

            </h2>

            <p className="mt-1 text-sm text-slate-500">

              Choose where the navigation menu should appear.

            </p>

          </div>


          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">

            {/* LEFT */}

            <button
              type="button"
              onClick={() =>
                updateValue(
                  "alignment",
                  "Left"
                )
              }
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition ${
                settings.alignment === "Left"
                  ? "border-[#ff6b00] bg-orange-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >

              <AlignLeft
                size={28}
                className={
                  settings.alignment === "Left"
                    ? "text-[#ff6b00]"
                    : "text-slate-500"
                }
              />

              <span className="font-semibold text-slate-800">
                Left
              </span>

              {settings.alignment === "Left" && (

                <span className="text-xs font-medium text-[#ff6b00]">
                  Selected
                </span>

              )}

            </button>


            {/* CENTER */}

            <button
              type="button"
              onClick={() =>
                updateValue(
                  "alignment",
                  "Center"
                )
              }
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition ${
                settings.alignment === "Center"
                  ? "border-[#ff6b00] bg-orange-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >

              <AlignCenter
                size={28}
                className={
                  settings.alignment === "Center"
                    ? "text-[#ff6b00]"
                    : "text-slate-500"
                }
              />

              <span className="font-semibold text-slate-800">
                Center
              </span>

              {settings.alignment === "Center" && (

                <span className="text-xs font-medium text-[#ff6b00]">
                  Selected
                </span>

              )}

            </button>


            {/* RIGHT */}

            <button
              type="button"
              onClick={() =>
                updateValue(
                  "alignment",
                  "Right"
                )
              }
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition ${
                settings.alignment === "Right"
                  ? "border-[#ff6b00] bg-orange-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >

              <AlignRight
                size={28}
                className={
                  settings.alignment === "Right"
                    ? "text-[#ff6b00]"
                    : "text-slate-500"
                }
              />

              <span className="font-semibold text-slate-800">
                Right
              </span>

              {settings.alignment === "Right" && (

                <span className="text-xs font-medium text-[#ff6b00]">
                  Selected
                </span>

              )}

            </button>

          </div>

        </div>


        {/* ====================================================
            SPACING
        ==================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="font-bold text-slate-900">
              Menu Spacing
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Control the horizontal spacing between menu items.
            </p>

          </div>


          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-3">

            {[
              "Compact",
              "Normal",
              "Spacious",
            ].map((spacing) => (

              <button
                key={spacing}
                type="button"
                onClick={() =>
                  updateValue(
                    "spacing",
                    spacing
                  )
                }
                className={`rounded-xl border-2 px-5 py-4 text-sm font-semibold transition ${
                  settings.spacing === spacing
                    ? "border-[#ff6b00] bg-orange-50 text-[#ff6b00]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >

                {spacing}

              </button>

            ))}

          </div>

        </div>


        {/* ====================================================
            DISPLAY OPTIONS
        ==================================================== */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-6 py-5">

            <h2 className="font-bold text-slate-900">
              Display Options
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose which elements are visible in the header.
            </p>

          </div>


          <div className="divide-y divide-slate-100">


            {/* ALL CATEGORIES */}

            <label className="flex cursor-pointer items-center justify-between px-6 py-5">

              <div>

                <p className="font-semibold text-slate-800">
                  Show All Categories
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Display the All Categories button in the header.
                </p>

              </div>


              <input
                type="checkbox"
                checked={
                  settings.showAllCategories
                }
                onChange={(e) =>
                  updateValue(
                    "showAllCategories",
                    e.target.checked
                  )
                }
                className="h-5 w-5 accent-[#ff6b00]"
              />

            </label>


            {/* DEALS */}

            <label className="flex cursor-pointer items-center justify-between px-6 py-5">

              <div>

                <p className="font-semibold text-slate-800">
                  Show Deals
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Display the Deals menu item in the header.
                </p>

              </div>


              <input
                type="checkbox"
                checked={
                  settings.showDeals
                }
                onChange={(e) =>
                  updateValue(
                    "showDeals",
                    e.target.checked
                  )
                }
                className="h-5 w-5 accent-[#ff6b00]"
              />

            </label>


            {/* STICKY */}

            <label className="flex cursor-pointer items-center justify-between px-6 py-5">

              <div>

                <p className="font-semibold text-slate-800">
                  Sticky Header
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Keep the header visible while scrolling.
                </p>

              </div>


              <input
                type="checkbox"
                checked={
                  settings.isSticky
                }
                onChange={(e) =>
                  updateValue(
                    "isSticky",
                    e.target.checked
                  )
                }
                className="h-5 w-5 accent-[#ff6b00]"
              />

            </label>


            {/* ACTIVE */}

            <label className="flex cursor-pointer items-center justify-between px-6 py-5">

              <div>

                <p className="font-semibold text-slate-800">
                  Header Menu Active
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Enable or disable the header navigation.
                </p>

              </div>


              <input
                type="checkbox"
                checked={
                  settings.isActive
                }
                onChange={(e) =>
                  updateValue(
                    "isActive",
                    e.target.checked
                  )
                }
                className="h-5 w-5 accent-[#ff6b00]"
              />

            </label>

          </div>

        </div>


        {/* ====================================================
            SAVE
        ==================================================== */}

        <div className="flex justify-end">

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#ff6b00] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#e95f00] disabled:cursor-not-allowed disabled:opacity-60"
          >

            {saving ? (

              <Loader2
                size={18}
                className="animate-spin"
              />

            ) : (

              <Save size={18} />

            )}

            {saving
              ? "Saving..."
              : "Save Settings"}

          </button>

        </div>

      </div>

    </div>

  );
}