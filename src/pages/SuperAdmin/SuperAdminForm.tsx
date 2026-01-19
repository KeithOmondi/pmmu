import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  Calendar,
  Target,
  User,
  Users,
  X,
  Check,
  Shield,
  Plus,
  Search,
} from "lucide-react";
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

const SuperAdminForm: React.FC<SuperAdminFormProps> = ({
  onClose,
  editData,
}) => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupConfirmed, setIsGroupConfirmed] = useState(false);

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
      startDate: editData.startDate
        ? new Date(editData.startDate).toISOString().slice(0, 16)
        : "",
      dueDate: editData.dueDate
        ? new Date(editData.dueDate).toISOString().slice(0, 16)
        : "",
      status: editData.status || "pending",
    });
  }, [editData]);

  const level1Categories = useMemo(
    () => categories.filter((c) => c.level === 1),
    [categories]
  );
  const level2Subs = useMemo(
    () =>
      categories.filter((c) => c.level === 2 && c.parent === form.categoryId),
    [categories, form.categoryId]
  );
  const level3Indicators = useMemo(
    () =>
      categories.filter(
        (c) => c.level === 3 && c.parent === form.level2CategoryId
      ),
    [categories, form.level2CategoryId]
  );
  const level4Categories = useMemo(
    () =>
      categories.filter((c) => c.level === 4 && c.parent === form.indicatorId),
    [categories, form.indicatorId]
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleChange = (field: keyof FormState, value: string | string[]) => {
    if (field === "assignedGroup") setIsGroupConfirmed(false);

    setForm((prev) => {
      const next = { ...prev, [field]: value } as FormState;

      if (field === "categoryId") {
        next.level2CategoryId = "";
        next.indicatorId = "";
        next.indicatorTitle = "";
        next.level4CategoryId = "";
      }
      if (field === "level2CategoryId") {
        next.indicatorId = "";
        next.indicatorTitle = "";
        next.level4CategoryId = "";
      }
      if (field === "indicatorId") {
        next.indicatorTitle =
          level3Indicators.find((i) => i._id === value)?.title || "";
        next.level4CategoryId = "";
      }
      if (field === "assignedToType") {
        next.assignedTo = "";
        next.assignedGroup = [];
      }
      return next;
    });
  };

  const toggleGroupMember = (userId: string) => {
    setIsGroupConfirmed(false);
    const currentGroup = [...form.assignedGroup];
    const index = currentGroup.indexOf(userId);
    if (index > -1) currentGroup.splice(index, 1);
    else currentGroup.push(userId);
    handleChange("assignedGroup", currentGroup);
  };

  const handleConfirmGroup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsGroupConfirmed(true);
    toast.success(`${form.assignedGroup.length} members confirmed`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...form };

      // Only send the relevant field
      if (form.assignedToType === "individual") {
        payload.assignedGroup = [];
      } else {
        payload.assignedTo = "";
      }

      if (editData) {
        await dispatch(updateIndicator({ id: editData._id, updates: payload }))
          .unwrap();
        toast.success("Indicator updated successfully");
      } else {
        await dispatch(createIndicator(payload)).unwrap();
        toast.success("New indicator initialized");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Submission failed");
    }
  };

  if (categoriesLoading || usersLoading)
    return (
      <div className="flex flex-col items-center justify-center p-16 text-[#1a3a32]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#c2a336]" />
        <p className="font-black text-[10px] uppercase tracking-[0.2em]">
          Synchronizing Registry Resources...
        </p>
      </div>
    );

  return (
    <div className="flex flex-col h-[85vh] w-full max-w-4xl bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden">
      {/* Fixed Header */}
      <div className="shrink-0 flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-[#c2a336] shadow-lg shadow-[#1a3a32]/20">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#1a3a32] tracking-tight">
              {editData ? "Assign" : "Task Assignment Form"}
            </h2>
            <p className="text-[10px] font-black text-[#c2a336] uppercase tracking-[0.2em]">
              .
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-3 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all text-slate-400"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <form
        id="super-admin-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto min-h-0 p-8 space-y-12 custom-scrollbar"
      >
        {/* Section 1: Classification */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#c2a336]/10 flex items-center justify-center text-[#c2a336]">
              <Target size={16} />
            </span>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1a3a32]">
              Hierarchy & Classification
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Dropdown
              label="SECTIONS"
              value={form.categoryId}
              onChange={(v) => handleChange("categoryId", v)}
              options={level1Categories}
              required
            />
            <Dropdown
              label="DEPARTMENTS"
              value={form.level2CategoryId}
              onChange={(v) => handleChange("level2CategoryId", v)}
              options={level2Subs}
              disabled={!form.categoryId}
              required
            />
            <Dropdown
              label="ACTIVITIES"
              value={form.indicatorId}
              onChange={(v) => handleChange("indicatorId", v)}
              options={level3Indicators}
              disabled={!form.level2CategoryId}
              required
            />
            <Dropdown
              label="ASSIGNMENTS"
              value={form.level4CategoryId}
              onChange={(v) => handleChange("level4CategoryId", v)}
              options={level4Categories}
              disabled={!form.indicatorId}
            />
          </div>
        </div>

        {/* Section 2: Details & Assignment */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#c2a336]/10 flex items-center justify-center text-[#c2a336]">
              <User size={16} />
            </span>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1a3a32]">
              Assignment Configuration
            </h3>
          </div>

          <div className="bg-[#f8fafc] p-6 rounded-[2rem] border border-slate-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextInput
                label="Unit of Measure"
                value={form.unitOfMeasure}
                onChange={(v) => handleChange("unitOfMeasure", v)}
                placeholder="Percentage (%), Count, etc."
                required
              />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  Assignee Type
                </label>
                <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl">
                  {(["individual", "group"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange("assignedToType", type)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                        form.assignedToType === type
                          ? "bg-[#1a3a32] text-white shadow-md shadow-[#1a3a32]/20"
                          : "text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {type === "individual" ? (
                        <User size={14} />
                      ) : (
                        <Users size={14} />
                      )}{" "}
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {form.assignedToType === "individual" ? (
              <Dropdown
                label="Primary Assignee"
                value={form.assignedTo}
                onChange={(v) => handleChange("assignedTo", v)}
                options={users.map((u) => ({ _id: u._id, title: u.name }))}
                required
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                  <div className="relative w-full md:w-64">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Search registry..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#c2a336] transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                      {form.assignedGroup.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmGroup}
                      className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 flex items-center gap-2 ${
                        isGroupConfirmed
                          ? "bg-emerald-500 text-white"
                          : "bg-[#1a3a32] text-[#c2a336] hover:bg-[#142d26]"
                      }`}
                    >
                      {isGroupConfirmed ? (
                        <>
                          <Check size={12} /> Confirmed
                        </>
                      ) : (
                        "OK"
                      )}
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredUsers.map((user) => {
                      const isSelected = form.assignedGroup.includes(user._id);
                      return (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => toggleGroupMember(user._id)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-[#1a3a32] border-[#1a3a32] text-white"
                              : "bg-white border-slate-100 text-slate-600 hover:border-[#c2a336]/30"
                          }`}
                        >
                          <span className="text-xs font-bold truncate pr-2">
                            {user.name}
                          </span>
                          {isSelected ? (
                            <Check size={14} className="text-[#c2a336]" />
                          ) : (
                            <Plus size={14} className="text-slate-200" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Timeline */}
        <div className="space-y-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#c2a336]/10 flex items-center justify-center text-[#c2a336]">
              <Calendar size={16} />
            </span>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1a3a32]">
              Execution Schedule
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextInput
              label="Commencement Date"
              type="datetime-local"
              value={form.startDate}
              onChange={(v) => handleChange("startDate", v)}
              required
            />
            <TextInput
              label="Filing Deadline"
              type="datetime-local"
              value={form.dueDate}
              onChange={(v) => handleChange("dueDate", v)}
              required
            />
          </div>
        </div>
      </form>

      {/* Fixed Footer */}
      <div className="shrink-0 p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-6">
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-all"
        >
          Discard Changes
        </button>
        <button
          form="super-admin-form"
          type="submit"
          disabled={indicatorsLoading}
          className="min-w-[240px] px-10 py-4 bg-[#1a3a32] hover:bg-[#142d26] disabled:bg-slate-200 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl shadow-xl shadow-[#1a3a32]/20 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          {indicatorsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#c2a336]" />
          ) : editData ? (
            "Authorize Updates"
          ) : (
            "Authorize New Metric"
          )}
        </button>
      </div>
    </div>
  );
};

/* --- Sub-components --- */
const Dropdown: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: any[];
  disabled?: boolean;
  required?: boolean;
}> = ({ label, value, onChange, options, disabled, required }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label} {required && <span className="text-[#c2a336]">*</span>}
    </label>
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full h-14 border border-slate-200 px-5 rounded-xl focus:ring-4 focus:ring-[#c2a336]/10 focus:border-[#c2a336] outline-none transition-all bg-white disabled:bg-slate-50 disabled:text-slate-300 appearance-none font-bold text-[#1a3a32] text-sm"
      >
        <option value="">Select Option...</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.title}
          </option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-[#c2a336] transition-colors">
        <Target size={16} />
      </div>
    </div>
  </div>
);

const TextInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}> = ({ label, value, onChange, required, type = "text", placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
      {label} {required && <span className="text-[#c2a336]">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full h-14 border border-slate-200 px-5 rounded-xl focus:ring-4 focus:ring-[#c2a336]/10 focus:border-[#c2a336] outline-none transition-all text-[#1a3a32] font-bold text-sm placeholder:text-slate-200"
    />
  </div>
);

export default SuperAdminForm;
