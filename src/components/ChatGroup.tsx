import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  File as FileIcon, 
  Download, 
  User, 
  MessageSquare,
  Search,
  MoreVertical,
  Paperclip,
  X,
  ChevronLeft,
  Loader2,
  Trash2,
  Bell
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAuth } from '../AuthContext';
import { useNotifications } from '../NotificationContext';
import { dataService } from '../services/dataService';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  timestamp: Timestamp | null;
  replyTo?: {
    id: string;
    senderName: string;
    message: string;
  };
  mentions?: string[];
}

export default function ChatGroup() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenId, setLastSeenId] = useState<string | null>(localStorage.getItem('chat_last_seen_id'));
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [activeChat, setActiveChat] = useState<boolean>(!isMobileView);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFirstLoad = useRef(true);

  // Update global unread count for sidebar
  useEffect(() => {
    localStorage.setItem('chat_unread_count', unreadCount.toString());
    // Dispatch custom event for Sidebar to pick up
    window.dispatchEvent(new Event('chat_unread_updated'));
  }, [unreadCount]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (!mobile) setActiveChat(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Check for new messages for notification
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        
        if (!isFirstLoad.current) {
          const prevLastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

          if (lastMsg.id !== prevLastMsg?.id && lastMsg.senderId !== user?.id) {
            // Only add to unread if not at bottom or chat not active
            if (!isAtBottom) {
              setUnreadCount(prev => prev + 1);
            }

            addNotification({
              title: `Pesan Baru dari ${lastMsg.senderName}`,
              message: lastMsg.message || 'Mengirim file',
              type: 'INPUT_DATA',
              userId: 'system',
              targetRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT]
            });
          }
        } else {
          // On first load, calculate unread based on lastSeenId
          if (lastSeenId) {
            const lastIdx = msgs.findIndex(m => m.id === lastSeenId);
            if (lastIdx !== -1) {
              const unread = msgs.slice(lastIdx + 1).filter(m => m.senderId !== user?.id).length;
              setUnreadCount(unread);
            }
          } else {
            setUnreadCount(Math.min(msgs.length, 50)); // Default some unread if never seen
          }
        }
      }

      setMessages(msgs);
      isFirstLoad.current = false;
      if (isAtBottom) {
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => unsubscribe();
  }, [user?.id]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Check if user is at bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
    
    // If at bottom, clear unread count and update last seen
    if (atBottom && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.id !== lastSeenId) {
        setLastSeenId(lastMsg.id);
        localStorage.setItem('chat_last_seen_id', lastMsg.id);
        setUnreadCount(0);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) return;
    if (!user) return;

    const textPayload = inputText;
    const replyPayload = replyingTo;
    
    setInputText('');
    setReplyingTo(null);
    
    try {
      let fileData = {};
      if (selectedFile) {
        setIsUploading(true);
        const fileRef = ref(storage, `chat/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);

        const downloadURL = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            }, 
            (error) => reject(error), 
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });

        fileData = {
          fileUrl: downloadURL,
          fileName: selectedFile.name,
          fileType: selectedFile.type
        };
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }

      // Check for mentions
      const mentions = textPayload.match(/@(\w+)/g)?.map(m => m.substring(1)) || [];

      const msgData: any = {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        message: textPayload,
        timestamp: serverTimestamp(),
        ...fileData
      };

      if (replyPayload) {
        msgData.replyTo = {
          id: replyPayload.id,
          senderName: replyPayload.senderName,
          message: replyPayload.message || 'File'
        };
      }

      if (mentions.length > 0) {
        msgData.mentions = mentions;
      }

      await addDoc(collection(db, 'messages'), msgData);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setIsUploading(false);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Tarik pesan ini?')) return;
    try {
      await dataService.deleteMessage(id);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleClearMessages = async () => {
    if (!confirm('Bersihkan semua pesan dalam grup ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await dataService.clearMessages();
      setUnreadCount(0);
      setLastSeenId(null);
      localStorage.removeItem('chat_last_seen_id');
      setShowOptionsMenu(false);
    } catch (err) {
      console.error("Error clearing messages:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowAttachmentMenu(false);
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return 'bg-purple-600';
      case UserRole.OLDAT:
        return 'bg-blue-600';
      case UserRole.DATLAP:
        return 'bg-emerald-600';
      default:
        return 'bg-slate-600';
    }
  };

  const getRoleLabelColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return 'text-purple-200';
      case UserRole.OLDAT:
        return 'text-blue-200';
      case UserRole.DATLAP:
        return 'text-emerald-200';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-slate-50 overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-200">
      {/* Sidebar - Group List */}
      <div className={cn(
        "w-full md:w-80 bg-white border-r border-slate-200 flex flex-col transition-all",
        isMobileView && activeChat ? "hidden" : "flex"
      )}>
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-800 tracking-tighter uppercase mb-4">Chat Grup</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Cari percakapan..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm border-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <button 
            onClick={() => isMobileView && setActiveChat(true)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10"
          >
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <MessageSquare size={20} />
            </div>
            <div className="text-left flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-800 text-sm uppercase tracking-tight">Grup Utama SATDAPUS</span>
                <span className="text-[10px] font-bold text-slate-400">Live</span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate whitespace-nowrap overflow-hidden w-32">
                {messages.length > 0 ? messages[messages.length-1].message || 'Sent a file' : 'Belum ada pesan'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white relative transition-all",
        isMobileView && !activeChat ? "hidden" : "flex"
      )}>
        {/* Chat Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {isMobileView && (
              <button 
                onClick={() => setActiveChat(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Grup Utama SATDAPUS</h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online Sekarang
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <Search size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <MoreVertical size={20} />
              </button>
              
              <AnimatePresence>
                {showOptionsMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowOptionsMenu(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-40"
                    >
                      <button 
                        onClick={handleClearMessages}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors text-left"
                      >
                        <Trash2 size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Bersihkan Pesan</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Message List */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50 relative"
        >
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.id;
            
            // Unread detection based on timestamp
            let isUnread = false;
            if (!isMe && lastSeenId) {
              const lastSeenMsg = messages.find(m => m.id === lastSeenId);
              if (lastSeenMsg && msg.timestamp && lastSeenMsg.timestamp) {
                isUnread = msg.timestamp.toMillis() > lastSeenMsg.timestamp.toMillis();
              } else if (!lastSeenMsg) {
                isUnread = true;
              }
            }

            const showDate = idx === 0 || 
              (msg.timestamp && messages[idx-1].timestamp && 
               format(msg.timestamp.toDate(), 'yyyy-MM-dd') !== format(messages[idx-1].timestamp.toDate(), 'yyyy-MM-dd'));

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="px-3 py-1 bg-slate-200 text-slate-500 text-[9px] font-black uppercase rounded-full tracking-widest">
                      {msg.timestamp ? format(msg.timestamp.toDate(), 'EEEE, d MMMM yyyy') : 'Baru saja'}
                    </span>
                  </div>
                )}
                <div className={cn("flex flex-col group/msg", isMe ? "items-end" : "items-start")}>
                  {!isMe && (
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">
                      {msg.senderName} • {msg.senderRole}
                    </span>
                  )}
                  <div className={cn("flex items-center gap-2 max-w-full relative", isMe ? "flex-row-reverse" : "flex-row")}>
                    {/* Swipe Indicator */}
                    <div className={cn(
                      "absolute top-1/2 -translate-y-1/2 flex items-center gap-2 text-primary opacity-0 pointer-events-none transition-opacity",
                      isMe ? "left-full ml-4" : "right-full mr-4"
                    )}>
                      <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Balas Pesan</span>
                      <Send size={12} className="rotate-180" />
                    </div>

                    <motion.div 
                      drag="x"
                      dragConstraints={{ left: isMe ? -100 : 0, right: isMe ? 0 : 100 }}
                      onDrag={(e, info) => {
                        const threshold = isMe ? -50 : 50;
                        const indicator = (e.currentTarget as HTMLElement).parentElement?.querySelector('.opacity-0');
                        if (indicator) {
                          if ((isMe && info.offset.x < threshold) || (!isMe && info.offset.x > threshold)) {
                            indicator.classList.remove('opacity-0');
                          } else {
                            indicator.classList.add('opacity-0');
                          }
                        }
                      }}
                      onDragEnd={(_, info) => {
                        const threshold = isMe ? -50 : 50;
                        if ((isMe && info.offset.x < threshold) || (!isMe && info.offset.x > threshold)) {
                          setReplyingTo(msg);
                        }
                        const indicator = (scrollRef.current as HTMLElement).querySelector('.opacity-0'); // This selector is too broad, but onDragEnd doesn't give target easily without ref
                      }}
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        backgroundColor: isUnread ? '#f0f9ff' : undefined
                      }}
                      className={cn(
                        "max-w-[85%] md:max-w-md p-4 rounded-3xl shadow-sm relative transition-colors duration-1000",
                        isMe 
                          ? cn(getRoleColor(user?.role || UserRole.USER), "text-white rounded-tr-none") 
                          : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-xl shadow-slate-200/50",
                        isUnread && !isMe && "animate-pulse"
                      )}
                    >
                      {/* Reply Link */}
                      {msg.replyTo && (
                        <div className={cn(
                          "mb-2 p-2 rounded-xl text-[10px] border-l-4",
                          isMe 
                            ? "bg-black/10 border-white/50 text-white/80" 
                            : "bg-slate-50 border-primary text-slate-500"
                        )}>
                          <p className="font-black uppercase tracking-widest">{msg.replyTo.senderName}</p>
                          <p className="truncate">{msg.replyTo.message}</p>
                        </div>
                      )}

                      {msg.message && (
                        <p className="text-sm font-medium leading-relaxed">
                          {msg.message.split(' ').map((word, wIdx) => (
                            word.startsWith('@') ? (
                              <span key={wIdx} className={cn("font-black underline decoration-2 underline-offset-4", isMe ? "text-white" : "text-primary")}>
                                {word}{' '}
                              </span>
                            ) : word + ' '
                          ))}
                        </p>
                      )}
                      
                      {msg.fileUrl && (
                        <div className={cn(
                          "mt-3 p-3 rounded-2xl border flex items-center gap-3",
                          isMe ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100"
                        )}>
                          {msg.fileType?.startsWith('image/') ? (
                            <div className="relative group/img overflow-hidden rounded-xl">
                              <img src={msg.fileUrl} alt={msg.fileName} className="max-w-full h-40 object-cover rounded-xl" referrerPolicy="no-referrer" />
                              <a 
                                href={msg.fileUrl} 
                                download={msg.fileName}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                              >
                                <Download size={20} />
                              </a>
                            </div>
                          ) : (
                            <>
                              <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                isMe ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                              )}>
                                <FileIcon size={20} />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className={cn("text-xs font-black truncate uppercase tracking-tighter", isMe ? "text-white" : "text-slate-800")}>
                                  {msg.fileName}
                                </p>
                                <p className={cn("text-[9px] font-bold uppercase", isMe ? "text-white/60" : "text-slate-400")}>
                                  {msg.fileType?.split('/')[1] || 'FILE'}
                                </p>
                              </div>
                              <a 
                                href={msg.fileUrl} 
                                download={msg.fileName}
                                className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  isMe ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-400"
                                )}
                              >
                                <Download size={16} />
                              </a>
                            </>
                          )}
                        </div>
                      )}
                      
                      <div className={cn(
                        "mt-2 flex items-center gap-1",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-[9px] font-black uppercase",
                          isMe ? "text-white/60" : "text-slate-400"
                        )}>
                          {msg.timestamp ? format(msg.timestamp.toDate(), 'HH:mm') : '...'}
                        </span>
                      </div>
                    </motion.div>

                    {/* Delete/Withdraw Button - only for sender or admin */}
                    {(isMe || user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="opacity-0 group-hover/msg:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Tarik pesan"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          
          <AnimatePresence>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-end"
              >
                <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                  <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                    Mengirim File... {Math.round(uploadProgress)}%
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Unread Message Bubble Float */}
          <AnimatePresence>
            {!isAtBottom && unreadCount > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={scrollToBottom}
                className="fixed bottom-32 right-12 bg-primary text-white px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 z-30 group active:scale-95 transition-all"
              >
                <Bell size={16} className="group-hover:animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest">{unreadCount} Pesan Baru</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <footer className="p-4 md:p-6 bg-white border-t border-slate-100">
          {/* Reply Preview */}
          <AnimatePresence>
            {replyingTo && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-primary/5 rounded-2xl border-l-4 border-primary flex items-center justify-between"
              >
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Membalas {replyingTo.senderName}</p>
                  <p className="text-xs text-slate-600 truncate">{replyingTo.message || 'File'}</p>
                </div>
                <button 
                  onClick={() => setReplyingTo(null)}
                  className="p-2 hover:bg-primary/10 rounded-lg text-primary"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {selectedFile && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  {selectedFile.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileIcon size={20} />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-tighter truncate w-40 md:w-80">
                    {selectedFile.name}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </motion.div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 transition-all"
              >
                <Paperclip size={20} />
              </button>
              
              <AnimatePresence>
                {showAttachmentMenu && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: -20 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute bottom-full left-0 mb-4 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-30 min-w-[200px]"
                  >
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ImageIcon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Galeri & Foto</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Kirim gambar momen</p>
                      </div>
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <FileIcon size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tighter">Dokumen & File</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">PDF, Excel, PDF, dll</p>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
            </div>

            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ketik pesan koordinasi..." 
              className="flex-1 px-6 py-4 bg-slate-100 rounded-[1.75rem] border-none focus:ring-2 focus:ring-primary/20 text-sm font-medium text-slate-700"
            />

            <button 
              type="submit"
              disabled={isUploading || (!inputText.trim() && !selectedFile)}
              className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="fill-current" />}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
