import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  X,
  FileEdit,
  Target,
  User,
  Users,
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Activity,
  ArrowRight,
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
  updateIndicator,
  selectIndicatorsLoading,
  type IIndicator,
  type IndicatorStatus,
  type UpdateIndicatorPayload,
} from "../../store/slices/indicatorsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

interface EditModalProps {
  indicator: IIndicator;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

const EditIndicatorModal: React.FC<EditModalProps> = ({
  indicator,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectAllCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);
  const isUpdating = useAppSelector(selectIndicatorsLoading);

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
    if (isOpen) {
      dispatch(fetchCategories());
      dispatch(fetchUsers());
    }
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (!indicator || !isOpen) return;
    setForm({
      categoryId: indicator.category?._id ?? "",
      level2CategoryId: indicator.level2Category?._id ?? "",
      indicatorId: (indicator as any).indicatorId?._id ?? "",
      indicatorTitle: indicator.indicatorTitle ?? "",
      level4CategoryId: (indicator as any).level4Category?._id ?? "",
      unitOfMeasure: indicator.unitOfMeasure ?? "",
      assignedToType: indicator.assignedToType ?? "individual",
      assignedTo:
        (indicator.assignedTo as any)?._id ?? indicator.assignedTo ?? "",
      assignedGroup: indicator.assignedGroup?.map((g: any) => g._id ?? g) ?? [],
      startDate: indicator.startDate
        ? new Date(indicator.startDate).toISOString().slice(0, 16)
        : "",
      dueDate: indicator.dueDate
        ? new Date(indicator.dueDate).toISOString().slice(0, 16)
        : "",
      status: indicator.status ?? "pending",
    });

    setIsGroupConfirmed(true);
  }, [indicator, isOpen]);

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
  const filteredUsers = useMemo(
    () =>
      users.filter((u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [users, searchTerm]
  );

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
    if (form.assignedToType === "group" && !isGroupConfirmed)
      return toast.error("Please confirm group selection.");

    const payload: UpdateIndicatorPayload = {
      id: indicator._id,
      updates: {
        category: form.categoryId,
        level2Category: form.level2CategoryId,
        indicatorId: form.indicatorId,
        indicatorTitle: form.indicatorTitle,
        level4Category: form.level4CategoryId,
        unitOfMeasure: form.unitOfMeasure,
        assignedToType: form.assignedToType,
        assignedTo:
          form.assignedToType === "individual" ? form.assignedTo : null,
        assignedGroup:
          form.assignedToType === "group" ? form.assignedGroup : [],
        startDate: form.startDate,
        dueDate: form.dueDate,
        status: form.status,
      } as any,
    };

    try {
      await dispatch(updateIndicator(payload)).unwrap();
      toast.success("Indicator updated successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    }
  };

  if (!isOpen) return null;

  if (categoriesLoading || usersLoading)
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1a3a32]/40 backdrop-blur-sm">
        <Loader2 className="w-12 h-12 animate-spin text-[#c2a336]" />
      </div>
    );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0a1a16]/80 backdrop-blur-xl p-4 sm:p-6">
      <div className="bg-[#fdfdfd] w-full max-w-5xl rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header - Signature Style */}
        <div className="bg-[#1a3a32] px-10 py-10 text-white relative overflow-hidden shrink-0">
          <FileEdit className="absolute -right-4 -bottom-4 text-white/5 w-40 h-40 rotate-12" />
          <div className="relative z-10 flex justify-between items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c2a336]/20 border border-[#c2a336]/30 rounded-full text-[#c2a336] font-black uppercase tracking-[0.2em] text-[9px]">
                <Activity size={12} /> Secure Modification Desk
              </div>
              <h2 className="text-3xl font-serif font-black leading-tight">
                Update Protocol Registry
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-4 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-2xl border border-white/10 transition-all text-white/50"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body - Clean Bento Layout */}
        <form
          onSubmit={handleSubmit}
          id="edit-indicator-form"
          className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar"
        >
          {/* Section 1: Hierarchy Management */}
          <div className="space-y-6">
            <SectionTitle icon={<Target size={18} />} title="Taxonomy & Hierarchy" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2">
              <Dropdown
                label="Primary Section"
                value={form.categoryId}
                options={level1Categories}
                onChange={(v) => handleChange("categoryId", v)}
                required
              />
              <Dropdown
                label="Department Unit"
                value={form.level2CategoryId}
                options={level2Subs}
                disabled={!form.categoryId}
                onChange={(v) => handleChange("level2CategoryId", v)}
                required
              />
              <Dropdown
                label="Registry Activity"
                value={form.indicatorId}
                options={level3Indicators}
                disabled={!form.level2CategoryId}
                onChange={(v) => handleChange("indicatorId", v)}
                required
              />
              <Dropdown
                label="Sub-Assignments"
                value={form.level4CategoryId}
                options={level4Categories}
                disabled={!form.indicatorId}
                onChange={(v) => handleChange("level4CategoryId", v)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Section 2: Assignment Authority */}
            <div className="lg:col-span-3 space-y-6">
              <SectionTitle icon={<Users size={18} />} title="Assignment Authority" />
              <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <TextInput
                    label="Operational Unit"
                    placeholder="e.g. Percentage, Metric"
                    value={form.unitOfMeasure}
                    onChange={(v) => handleChange("unitOfMeasure", v)}
                    required
                  />
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                      Assignee Type
                    </label>
                    <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      {(["individual", "group"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleChange("assignedToType", type)}
                          className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase rounded-xl transition-all ${
                            form.assignedToType === type
                              ? "bg-[#1a3a32] text-white shadow-lg"
                              : "text-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {type === "individual" ? <User size={14} /> : <Users size={14} />}
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {form.assignedToType === "individual" ? (
                  <Dropdown
                    label="Designated Officer"
                    value={form.assignedTo}
                    options={users.map((u) => ({ _id: u._id, title: u.name }))}
                    onChange={(v) => handleChange("assignedTo", v)}
                    required
                  />
                ) : (
                  <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search Registry..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 ring-[#c2a336]/20 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleConfirmGroup}
                        className={`px-6 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${
                          isGroupConfirmed 
                            ? "bg-emerald-500 text-white" 
                            : "bg-[#1a3a32] text-[#c2a336] hover:bg-[#c2a336] hover:text-[#1a3a32]"
                        }`}
                      >
                        {isGroupConfirmed ? <CheckCircle2 size={14} /> : "Validate"}
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-4 grid grid-cols-2 gap-2 custom-scrollbar">
                      {filteredUsers.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => toggleGroupMember(user._id)}
                          className={`p-4 rounded-xl border-2 transition-all text-left relative group ${
                            form.assignedGroup.includes(user._id)
                              ? "border-[#1a3a32] bg-[#1a3a32] text-white shadow-md"
                              : "border-slate-100 bg-white hover:border-[#c2a336]/30"
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">{user.name}</div>
                          {form.assignedGroup.includes(user._id) && (
                            <CheckCircle2 size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c2a336]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Scheduling */}
            <div className="lg:col-span-2 space-y-6">
              <SectionTitle icon={<Calendar size={18} />} title="Chronology" />
              <div className="grid grid-cols-1 gap-6">
                <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-6">
                  <TextInput
                    label="Commencement Date"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(v) => handleChange("startDate", v)}
                    required
                  />
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
                  <TextInput
                    label="Expiration / Deadline"
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={(v) => handleChange("dueDate", v)}
                    required
                  />
                </div>
                
                <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                   <Plus className="absolute -right-2 -top-2 text-white/5 w-24 h-24 group-hover:rotate-90 transition-transform duration-700" />
                   <div className="relative z-10 space-y-2">
                      <p className="text-[#c2a336] text-[10px] font-black uppercase tracking-widest">Compliance Note</p>
                      <p className="text-white/60 text-[11px] leading-relaxed">
                        Adjusting these parameters will re-calculate the compliance health score for this specific registry item.
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer - Command Center Style */}
        <div className="p-10 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            type="button"
            className="group flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform" />
            Discard Changes
          </button>
          
          <div className="flex items-center gap-4">
            <button
              form="edit-indicator-form"
              type="submit"
              disabled={isUpdating}
              className="group min-w-[300px] flex items-center justify-center gap-3 py-5 bg-[#1a3a32] text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#1a3a32]/20 hover:bg-[#c2a336] transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Authorize & Commit Updates
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div className="flex items-center gap-4 px-2">
    <span className="w-10 h-10 rounded-2xl bg-[#c2a336]/10 flex items-center justify-center text-[#c2a336] shadow-sm">
      {icon}
    </span>
    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1a3a32]">
      {title}
    </h3>
  </div>
);

const Dropdown: React.FC<{
  label: string;
  value: string;
  options: any[];
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
}> = ({ label, value, options, onChange, disabled, required }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
      {label} {required && <span className="text-[#c2a336]">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-14 border border-slate-200 px-5 rounded-2xl bg-white font-bold text-[#1a3a32] text-xs appearance-none disabled:bg-slate-50 disabled:text-slate-300 focus:ring-2 ring-[#c2a336]/20 outline-none transition-all shadow-sm"
      >
        <option value="">Select Registry...</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.title || opt.name}
          </option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ArrowRight size={14} className="rotate-90" />
      </div>
    </div>
  </div>
);

const TextInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, type = "text", required, placeholder }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
      {label} {required && <span className="text-[#c2a336]">*</span>}
    </label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full h-14 border border-slate-200 px-5 rounded-2xl font-bold text-[#1a3a32] text-xs focus:ring-2 ring-[#c2a336]/20 outline-none transition-all shadow-sm"
    />
  </div>
);

export default EditIndicatorModal;