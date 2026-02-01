import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Loader2,
  X,
  Plus,
  FileEdit,
  Target,
  User,
  Calendar,
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
  type UpdateIndicatorPayload,
  type IndicatorStatus,
} from "../../store/slices/indicatorsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

/* =====================================================
    INTERFACES (Moved to top for global scope)
===================================================== */
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
  unitOfMeasure: string;
  assignedToType: "individual" | "group";
  assignedTo: string;
  assignedGroup: string[];
  startDate: string;
  dueDate: string;
  status: IndicatorStatus;
  notes: string;
}

interface DropdownProps {
  label: string;
  value: string;
  options: any[];
  onChange: (v: string) => void;
  disabled?: boolean;
  required?: boolean;
}

interface TextInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}

/* =====================================================
    MAIN COMPONENT
===================================================== */
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

  const [form, setForm] = useState<FormState>({
    categoryId: "",
    level2CategoryId: "",
    indicatorId: "",
    indicatorTitle: "",
    unitOfMeasure: "",
    assignedToType: "individual",
    assignedTo: "",
    assignedGroup: [],
    startDate: "",
    dueDate: "",
    status: "pending",
    notes: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupConfirmed, setIsGroupConfirmed] = useState(true);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchCategories());
      dispatch(fetchUsers());
    }
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (indicator && isOpen) {
      setForm({
        categoryId: (indicator.category as any)?._id || indicator.category || "",
        level2CategoryId: (indicator.level2Category as any)?._id || indicator.level2Category || "",
        indicatorId: (indicator as any).indicatorId?._id || (indicator as any).indicatorId || "",
        indicatorTitle: indicator.indicatorTitle || "",
        unitOfMeasure: indicator.unitOfMeasure || "",
        assignedToType: indicator.assignedToType || "individual",
        assignedTo: (indicator.assignedTo as any)?._id || indicator.assignedTo || "",
        assignedGroup: indicator.assignedGroup?.map((g: any) => g._id || g) || [],
        startDate: indicator.startDate ? new Date(indicator.startDate).toISOString().slice(0, 16) : "",
        dueDate: indicator.dueDate ? new Date(indicator.dueDate).toISOString().slice(0, 16) : "",
        status: indicator.status || "pending",
        notes: "",
      });
      setIsGroupConfirmed(true);
    }
  }, [indicator, isOpen]);

  const level1Categories = useMemo(() => categories.filter((c) => c.level === 1), [categories]);
  const level2Subs = useMemo(() => categories.filter((c) => c.level === 2 && c.parent === form.categoryId), [categories, form.categoryId]);
  const level3Indicators = useMemo(() => categories.filter((c) => c.level === 3 && c.parent === form.level2CategoryId), [categories, form.level2CategoryId]);
  const filteredUsers = useMemo(() => users.filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase())), [users, searchTerm]);

  const handleChange = (field: keyof FormState, value: string | string[]) => {
    if (field === "assignedGroup") setIsGroupConfirmed(false);
    setForm((prev) => {
      const next = { ...prev, [field]: value } as FormState;
      if (field === "categoryId") { next.level2CategoryId = ""; next.indicatorId = ""; }
      if (field === "level2CategoryId") { next.indicatorId = ""; }
      if (field === "indicatorId") {
        next.indicatorTitle = level3Indicators.find((i) => i._id === value)?.title || "";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.assignedToType === "group" && !isGroupConfirmed) return toast.error("Please confirm group selection.");
    if (!form.notes.trim()) return toast.error("Justification note is required.");

    const payload: UpdateIndicatorPayload = {
      id: indicator._id,
      updates: {
        category: form.categoryId,
        level2Category: form.level2CategoryId,
        indicatorId: form.indicatorId,
        indicatorTitle: form.indicatorTitle,
        unitOfMeasure: form.unitOfMeasure,
        assignedToType: form.assignedToType,
        assignedTo: form.assignedToType === "individual" ? form.assignedTo : null,
        assignedGroup: form.assignedToType === "group" ? form.assignedGroup : [],
        startDate: form.startDate,
        dueDate: form.dueDate,
        status: form.status,
      } as any,
    };

    try {
      await dispatch(updateIndicator(payload)).unwrap();
      toast.success("Registry authorized successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Authorization failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1a3a32]/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-[#c2a336]/20 overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="bg-[#fcfaf2] px-10 py-6 border-b border-[#c2a336]/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#1a3a32] rounded-2xl text-[#c2a336]">
              <FileEdit size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a3a32]">Modify Registry</h2>
              <p className="text-[9px] font-black text-[#c2a336] uppercase tracking-[0.2em]">Authorization Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        {categoriesLoading || usersLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[#c2a336]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} id="edit-indicator-form" className="flex-1 overflow-y-auto p-10 space-y-12">
            <div className="space-y-6">
              <SectionTitle icon={<Target size={16} />} title="Hierarchy" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Dropdown label="Section" value={form.categoryId} options={level1Categories} onChange={(v: string) => handleChange("categoryId", v)} required />
                <Dropdown label="Department" value={form.level2CategoryId} options={level2Subs} disabled={!form.categoryId} onChange={(v: string) => handleChange("level2CategoryId", v)} required />
                <Dropdown label="Activity" value={form.indicatorId} options={level3Indicators} disabled={!form.level2CategoryId} onChange={(v: string) => handleChange("indicatorId", v)} required />
              </div>
            </div>

            <div className="space-y-6">
              <SectionTitle icon={<User size={16} />} title="Assignment" />
              <div className="bg-[#f8fafc] p-6 rounded-[2rem] border border-slate-100 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TextInput label="Unit" value={form.unitOfMeasure} onChange={(v: string) => handleChange("unitOfMeasure", v)} required />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400">Assignee Type</label>
                    <div className="flex p-1 bg-white border rounded-2xl">
                      {(["individual", "group"] as const).map((type) => (
                        <button key={type} type="button" onClick={() => handleChange("assignedToType", type)} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${form.assignedToType === type ? "bg-[#1a3a32] text-white" : "text-slate-400"}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {form.assignedToType === "individual" ? (
                  <Dropdown label="Assignee" value={form.assignedTo} options={users.map((u) => ({ _id: u._id, title: u.name }))} onChange={(v: string) => handleChange("assignedTo", v)} required />
                ) : (
                  <div className="bg-white border rounded-[1.5rem] overflow-hidden">
                    <div className="p-4 border-b flex justify-between items-center">
                      <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 py-2 border rounded-xl text-xs outline-none" />
                      <button type="button" onClick={() => setIsGroupConfirmed(true)} className="px-4 py-2 text-[10px] font-black uppercase rounded-lg bg-[#1a3a32] text-[#c2a336]">
                        {isGroupConfirmed ? "Confirmed" : "Confirm Selection"}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-4 grid grid-cols-2 gap-2">
                      {filteredUsers.map((user) => (
                        <button key={user._id} type="button" onClick={() => toggleGroupMember(user._id)} className={`p-3 rounded-xl border text-xs font-bold ${form.assignedGroup.includes(user._id) ? "bg-[#1a3a32] text-white" : "bg-white"}`}>
                          {user.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <SectionTitle icon={<Calendar size={16} />} title="Schedule" />
                <TextInput label="Start" type="datetime-local" value={form.startDate} onChange={(v: string) => handleChange("startDate", v)} required />
                <TextInput label="Due" type="datetime-local" value={form.dueDate} onChange={(v: string) => handleChange("dueDate", v)} required />
              </div>
              <div className="space-y-6">
                <SectionTitle icon={<Plus size={16} />} title="Justification" />
                <textarea className="w-full h-[140px] p-5 bg-slate-50 border rounded-2xl text-xs font-bold outline-none" placeholder="Reason for change..." value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} required />
              </div>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-8 bg-[#fcfaf2] border-t flex items-center justify-between shrink-0">
          <button onClick={onClose} type="button" className="text-[10px] font-black uppercase text-slate-400">Cancel</button>
          <button form="edit-indicator-form" type="submit" disabled={isUpdating} className="min-w-[260px] py-4 bg-[#1a3a32] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] disabled:opacity-50">
            {isUpdating ? "Updating..." : "Authorize Updates"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
    HELPER COMPONENTS (Now properly typed)
===================================================== */
const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-3">
    <span className="w-8 h-8 rounded-lg bg-[#c2a336]/10 flex items-center justify-center text-[#c2a336]">{icon}</span>
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3a32]">{title}</h3>
  </div>
);

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onChange, disabled, required }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400">{label} {required && "*"}</label>
    <select 
        value={value} 
        disabled={disabled} 
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)} 
        className="w-full h-14 border px-5 rounded-xl bg-white font-bold text-[#1a3a32] text-xs appearance-none disabled:bg-slate-50"
    >
      <option value="">Select...</option>
      {options.map((opt) => <option key={opt._id} value={opt._id}>{opt.title || opt.name}</option>)}
    </select>
  </div>
);

const TextInput: React.FC<TextInputProps> = ({ label, value, onChange, type = "text", required }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-slate-400">{label} {required && "*"}</label>
    <input 
        type={type} 
        value={value} 
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
        required={required} 
        className="w-full h-14 border px-5 rounded-xl font-bold text-[#1a3a32] text-xs" 
    />
  </div>
);

export default EditIndicatorModal;