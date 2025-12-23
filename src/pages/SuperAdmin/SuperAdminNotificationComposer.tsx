import React, { useEffect, useState } from "react";
import {
  Megaphone,
  User,
  Users,
  Filter,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  broadcastNotification,
  sendNotificationToUser,
  sendNotificationToGroup,
  sendNotificationByCriteria,
  selectNotificationsSending,
  selectNotificationsError,
  selectNotificationsSuccess,
  clearNotificationsError,
  clearNotificationsSuccess,
} from "../../store/slices/notificationsSlice";
import { fetchUsers, selectAllUsers, selectUsersLoading } from "../../store/slices/userSlice";

type Mode = "broadcast" | "user" | "group" | "criteria";

const SuperAdminNotificationComposer: React.FC = () => {
  const dispatch = useAppDispatch();
  const sending = useAppSelector(selectNotificationsSending);
  const error = useAppSelector(selectNotificationsError);
  const success = useAppSelector(selectNotificationsSuccess);

  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);

  const [mode, setMode] = useState<Mode>("broadcast");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const resetMessages = () => {
    dispatch(clearNotificationsError());
    dispatch(clearNotificationsSuccess());
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const filteredUsers =
    mode === "criteria"
      ? users.filter(
          (u) =>
            (!role || u.role?.toLowerCase().includes(role.toLowerCase())) &&
            (!department || u.department?.toLowerCase().includes(department.toLowerCase()))
        )
      : users;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!title || !message) return;

    switch (mode) {
      case "broadcast":
        dispatch(broadcastNotification({ title, message }));
        break;

      case "user":
        if (selectedUserIds.length !== 1) return;
        dispatch(
          sendNotificationToUser({
            userId: selectedUserIds[0],
            title,
            message,
          })
        );
        break;

      case "group":
        if (!selectedUserIds.length) return;
        dispatch(
          sendNotificationToGroup({
            userIds: selectedUserIds,
            title,
            message,
          })
        );
        break;

      case "criteria":
        if (!role && !department) return;
        dispatch(
          sendNotificationByCriteria({
            title,
            message,
            role: role || undefined,
            department: department || undefined,
          })
        );
        break;
    }

    setMessage("");
    setSelectedUserIds([]);
  };

  const modes = [
    { id: "broadcast", label: "Broadcast", icon: Megaphone },
    { id: "user", label: "Individual", icon: User },
    { id: "group", label: "Group", icon: Users },
    { id: "criteria", label: "Criteria", icon: Filter },
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a3a32] p-8 text-center border-b border-[#c2a336]/20">
        <div className="inline-flex p-3 bg-[#c2a336]/10 rounded-2xl mb-4">
          <Megaphone className="text-[#c2a336] w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Notification Dispatch
        </h2>
        <p className="text-[10px] text-[#c2a336] font-black uppercase tracking-[0.3em] mt-1">
          Institutional Communication Hub
        </p>
      </div>

      <div className="p-8 space-y-8">
        {/* Mode Switcher */}
        <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex flex-wrap gap-1">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id as Mode)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-[#1a3a32] text-white shadow-lg shadow-[#1a3a32]/20 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-[#c2a336]" : ""} />
                {m.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Message */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Subject Header
              </label>
              <input
                className="w-full h-14 border border-slate-200 px-5 rounded-2xl focus:ring-4 focus:ring-[#c2a336]/10 focus:border-[#c2a336] outline-none transition-all font-bold text-[#1a3a32]"
                placeholder="Enter formal notice title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Dispatch Message
              </label>
              <textarea
                className="w-full border border-slate-200 p-5 rounded-2xl focus:ring-4 focus:ring-[#c2a336]/10 focus:border-[#c2a336] outline-none transition-all font-medium text-slate-700 min-h-[150px]"
                placeholder="Draft your detailed institutional message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contextual Inputs */}
          {mode !== "broadcast" && (
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 border-dashed space-y-4">
              {usersLoading && <p className="text-xs text-slate-500">Loading users...</p>}

              {(mode === "user" || mode === "group" || mode === "criteria") && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {mode === "user" ? "Select User" : "Select Users"}
                  </label>
                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-xl">
                    {filteredUsers.map((u) => (
                      <label key={u._id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u._id)}
                          onChange={() => toggleUserSelection(u._id)}
                        />
                        {u.name} ({u.email})
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {mode === "criteria" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <input
                    type="text"
                    placeholder="Filter by Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-12 border border-slate-200 px-4 rounded-xl outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Filter by Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-12 border border-slate-200 px-4 rounded-xl outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl animate-in fade-in zoom-in duration-200">
              <AlertCircle size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl animate-in fade-in zoom-in duration-200">
              <CheckCircle2 size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">{success}</p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              disabled={sending}
              className="group relative flex items-center justify-center gap-3 w-full md:w-auto min-w-[280px] bg-[#1a3a32] hover:bg-[#142d26] text-white py-5 px-10 rounded-2xl shadow-xl shadow-[#1a3a32]/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#c2a336]" />
              ) : (
                <>
                  <span className="text-xs font-black uppercase tracking-[0.3em]">
                    Authorize Dispatch
                  </span>
                  <Send
                    size={16}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-[#c2a336]"
                  />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminNotificationComposer;
