import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, UserMinus, Copy, Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { useTripStore } from '../../store/useTripStore';
import Avatar from '../Avatar';

export default function MembersTab({ trip, members }) {
  const { user } = useAuthStore();
  const { removeMember } = useTripStore();
  const [copied, setCopied] = useState(false);

  const isAdmin = members.some((m) => m.id === user?.id && m.role === 'admin');
  const inviteLink = `${window.location.origin}/join/${trip.join_code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Invite link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Could not copy link'); }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`🧳 Join my trip "${trip.name}" on HisabKitab!\n\n👉 ${inviteLink}\n\nOr use code: ${trip.join_code}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name}?`)) return;
    try {
      await removeMember(member.member_row_id);
      toast.success(`${member.name} removed`);
    } catch (err) {
      toast.error(err.message || 'Could not remove member');
    }
  };

  return (
    <div className="px-5 pb-28 pt-4">
      <div className="card bg-teal-600 text-white mb-5">
        <p className="text-teal-100 text-xs font-semibold uppercase tracking-wide mb-1">Invite Friends</p>
        <p className="text-2xl font-mono font-bold tracking-widest mb-3">{trip.join_code}</p>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex-1 bg-white/15 rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button onClick={handleShareWhatsApp} className="flex-1 bg-saffron-500 rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-sm font-semibold">
            <Share2 className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      </div>
      <h3 className="font-bold text-teal-900 mb-3">Group Members <span className="text-teal-400 font-normal">({members.length})</span></h3>
      <div className="space-y-2">
        {members.map((m, idx) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="card !p-3 flex items-center gap-3">
            <Avatar name={m.name} url={m.avatar_url} size={42} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-teal-900 truncate">{m.name}</p>
                {m.role === 'admin' && <Crown className="w-3.5 h-3.5 text-saffron-500" />}
              </div>
              <p className="text-xs text-teal-400 truncate">{m.email}</p>
            </div>
            {isAdmin && m.id !== user.id && (
              <button onClick={() => handleRemove(m)} className="text-red-400 p-1.5"><UserMinus className="w-4 h-4" /></button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}