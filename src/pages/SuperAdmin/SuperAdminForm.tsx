import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Loader2, Calendar, Target, User, Users, X } from "lucide-react";
import {
  fetchCategories,
  selectAllCategories,
  selectCategoriesLoading,
} from "../../store/slices/categoriesSlice";
import {
  fetchUsers,
  selectAllUsers,
  selectUsersLoading,
} from "../../store/slices/userSlice";
import {
  createIndicator,
  updateIndicator,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { IndicatorStatus } from "../../store/slices/indicatorsSlice";

/* --- Interfaces --- */

interface SuperAdminFormProps {
  onClose: () => void;
  editData?: any;
}

interface FormState {
  categoryId: string;
  level2CategoryId: string;
  indicatorId: string;
  indicatorTitle: string;
  level4CategoryId: string;
  unitOfMeasure: string;
  assignedToType: "individual" | "group";
  assignedTo: string;
  assignedGroup: string[];
  startDate: string;
  dueDate: string;
  status: IndicatorStatus;
}

interface DropdownProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { _id: string; title: string }[];
  disabled?: boolean;
  required?: boolean;
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}

/* --- Main Component --- */

const SuperAdminForm: React.FC<SuperAdminFormProps> = ({ onClose, editData }) => {
  const dispatch = useAppDispatch();

  const categories = useAppSelector(selectAllCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);

  const defaultForm: FormState = {
    categoryId: "",
    level2CategoryId: "",
    indicatorId: "",
    indicatorTitle: "",
    level4CategoryId: "",
    unitOfMeasure: "",
    assignedToType: "individual",
    assignedTo: "",
    assignedGroup: [],
    startDate: "",
    dueDate: "",
    status: "pending",
  };

  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!editData) return setForm(defaultForm);
    setForm({
      categoryId: editData.category?._id || "",
      level2CategoryId: editData.level2Category?._id || "",
      indicatorId: editData.indicator?._id || "",
      indicatorTitle: editData.indicatorTitle || "",
      level4CategoryId: editData.level4Category?._id || "",
      unitOfMeasure: editData.unitOfMeasure || "",
      assignedToType: editData.assignedToType || "individual",
      assignedTo: editData.assignedTo?._id || "",
      assignedGroup: editData.assignedGroup?.map((g: any) => g._id) || [],
      startDate: editData.startDate ? new Date(editData.startDate).toISOString().slice(0, 16) : "",
      dueDate: editData.dueDate ? new Date(editData.dueDate).toISOString().slice(0, 16) : "",
      status: editData.status || "pending",
    });
  }, [editData]);

  const level1Categories = useMemo(() => categories.filter((c) => c.level === 1), [categories]);
  const level2Subs = useMemo(() => categories.filter((c) => c.level === 2 && c.parent === form.categoryId), [categories, form.categoryId]);
  const level3Indicators = useMemo(() => categories.filter((c) => c.level === 3 && c.parent === form.level2CategoryId), [categories, form.level2CategoryId]);
  const level4Categories = useMemo(() => categories.filter((c) => c.level === 4 && c.parent === form.indicatorId), [categories, form.indicatorId]);

  // Updated handleChange with explicit types to prevent implicit 'any'
  const handleChange = (field: keyof FormState, value: string | string[]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value } as FormState;
      if (field === "categoryId") { next.level2CategoryId = ""; next.indicatorId = ""; next.indicatorTitle = ""; next.level4CategoryId = ""; }
      if (field === "level2CategoryId") { next.indicatorId = ""; next.indicatorTitle = ""; next.level4CategoryId = ""; }
      if (field === "indicatorId") { next.indicatorTitle = level3Indicators.find((i) => i._id === value)?.title || ""; next.level4CategoryId = ""; }
      if (field === "assignedToType") { next.assignedTo = ""; next.assignedGroup = []; }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editData) {
        await dispatch(updateIndicator({ id: editData._id, updates: form as any })).unwrap();
        toast.success("Indicator updated");
      } else {
        await dispatch(createIndicator(form as any)).unwrap();
        toast.success("Indicator added");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Submission failed");
    }
  };

  if (categoriesLoading || usersLoading)
    return (
      <div className="flex flex-col items-center justify-center p-12 text-indigo-600">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="font-medium text-[10px] uppercase tracking-widest">Loading Resources...</p>
      </div>
    );

  return (
    <div className="flex flex-col h-full max-h-[90vh] md:max-h-none overflow-hidden rounded-3xl bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{editData ? "Edit Indicator" : "New Indicator"}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Command Center Registry</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/30">
        {/* Section 1: Classification */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
            <Target className="w-3 h-3" /> Hierarchy & Classification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropdown label="Main Category" value={form.categoryId} onChange={(v: string) => handleChange("categoryId", v)} options={level1Categories} required />
            <Dropdown label="Subcategory (L2)" value={form.level2CategoryId} onChange={(v: string) => handleChange("level2CategoryId", v)} options={level2Subs} disabled={!form.categoryId} required />
            <Dropdown label="Indicator (L3)" value={form.indicatorId} onChange={(v: string) => handleChange("indicatorId", v)} options={level3Indicators} disabled={!form.level2CategoryId} required />
            <Dropdown label="Deep Category (L4)" value={form.level4CategoryId} onChange={(v: string) => handleChange("level4CategoryId", v)} options={level4Categories} disabled={!form.indicatorId} />
          </div>
        </div>

        {/* Section 2: Details & Assignment */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
            <User className="w-3 h-3" /> Details & Assignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm">
            <TextInput label="Unit of Measure" value={form.unitOfMeasure} onChange={(v: string) => handleChange("unitOfMeasure", v)} placeholder="e.g. Percentage (%)" required />
            
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Assignment Strategy</label>
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                {(["individual", "group"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange("assignedToType", type)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${
                      form.assignedToType === type ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {type === "individual" ? <User size={12} /> : <Users size={12} />}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              {form.assignedToType === "individual" ? (
                <Dropdown label="Select Assignee" value={form.assignedTo} onChange={(v: string) => handleChange("assignedTo", v)} options={users.map((u) => ({ _id: u._id, title: u.name }))} required />
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Assign Multiple Members</label>
                  <select
                    multiple
                    value={form.assignedGroup}
                    onChange={(e) => handleChange("assignedGroup", Array.from(e.target.selectedOptions, (o) => o.value))}
                    className="w-full border border-slate-200 px-4 py-3 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all min-h-[140px] text-sm font-bold text-slate-700"
                  >
                    {users.map((u) => <option key={u._id} value={u._id} className="py-2 px-2 rounded-lg mb-1 checked:bg-indigo-50">{u.name}</option>)}
                  </select>
                  <p className="text-[9px] font-bold text-slate-400 italic uppercase tracking-tighter">Hold Cmd/Ctrl for multi-selection</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Timeline */}
        <div className="space-y-4 pb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Execution Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Start Date & Time" type="datetime-local" value={form.startDate} onChange={(v: string) => handleChange("startDate", v)} required />
            <TextInput label="Due Date & Time" type="datetime-local" value={form.dueDate} onChange={(v: string) => handleChange("dueDate", v)} required />
          </div>
        </div>
      </form>

      {/* Footer */}
      <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
        <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={indicatorsLoading}
          className="flex-1 md:flex-none px-10 py-4 bg-[#1a3a32] hover:bg-[#255247] disabled:bg-slate-200 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#1a3a32]/10 transition-all flex items-center justify-center gap-3"
        >
          {indicatorsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : editData ? "Update Registry" : "Initialize Metric"}
        </button>
      </div>
    </div>
  );
};

/* --- Refined Sub-components with Explicit Types --- */

const Dropdown: React.FC<DropdownProps> = ({ label, value, onChange, options, disabled, required }) => (
  <div className="space-y-1.5 flex flex-col">
    <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-14 border border-slate-200 px-5 py-2 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all bg-white disabled:bg-slate-50 disabled:text-slate-400 appearance-none font-bold text-slate-800 text-sm shadow-sm"
      >
        <option value="">Select {label}...</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>{opt.title}</option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
        <Target size={14} />
      </div>
    </div>
  </div>
);

const TextInput: React.FC<TextInputProps> = ({ label, value, onChange, required, type = "text", placeholder }) => (
  <div className="space-y-1.5 flex flex-col">
    <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      required={required}
      className="w-full h-14 border border-slate-200 px-5 py-2 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold text-sm shadow-sm placeholder:text-slate-300"
    />
  </div>
);

export default SuperAdminForm;