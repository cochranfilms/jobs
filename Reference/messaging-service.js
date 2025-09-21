/**
 * Messaging Service for Cochran Films Platform
 * Handles real-time messaging between users and admins
 */

class MessagingService {
    constructor() {
        this.firestore = null;
        this.auth = null;
        this.app = null;
        this.storage = null;
        this.currentUser = null;
        this.conversations = new Map();
        this.messageListeners = new Map();
        this.conversationsUnsubscribe = null;
        this.isAdmin = false;
        
        // Initialize when Firebase is ready
        this.readyPromise = this.initializeMessaging();
    }

    async initializeMessaging() {
        try {
            // Wait for Firebase to be initialized
            await window.FirebaseConfig.waitForInit();
            
            this.app = window.FirebaseConfig.app || (firebase && firebase.app ? firebase.app() : null);
            this.firestore = window.FirebaseConfig.getFirestore();
            this.auth = window.FirebaseConfig.auth;
            try {
                this.storage = this.app && this.app.storage ? this.app.storage() : (firebase && firebase.storage ? firebase.storage() : null);
                if (this.storage && typeof this.storage.setMaxUploadRetryTime === 'function') {
                    this.storage.setMaxUploadRetryTime(15000);
                }
            } catch (e) {
                console.warn('⚠️ Storage not ready yet, will retry lazily');
                this.storage = null;
            }
            this.currentUser = this.auth.currentUser;
            
            // Check if user is admin
            this.isAdmin = window.FirebaseConfig.isAdminUser(this.currentUser?.email);
            
            console.log('💬 Messaging service initialized', {
                user: this.currentUser?.email,
                isAdmin: this.isAdmin
            });
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.isAdmin = window.FirebaseConfig.isAdminUser(user?.email);
                if (user) {
                    this.loadUserConversations();
                } else {
                    this.cleanup();
                }
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize messaging service:', error);
            throw error;
        }
        return true;
    }

    async ensureReadyForWrites(timeoutMs = 5000) {
        await window.FirebaseConfig.waitForInit();
        if (!this.app) this.app = window.FirebaseConfig.app || (firebase && firebase.app ? firebase.app() : null);
        if (!this.firestore) this.firestore = window.FirebaseConfig.getFirestore();
        if (!this.auth) this.auth = window.FirebaseConfig.auth;
        if (!this.storage) {
            try { this.storage = this.app && this.app.storage ? this.app.storage() : (firebase && firebase.storage ? firebase.storage() : null); } catch(_) {}
        }

        if (this.auth && !this.currentUser) this.currentUser = this.auth.currentUser;
        if (this.currentUser) return true;

        // wait for onAuthStateChanged
        await new Promise((resolve) => {
            const started = Date.now();
            const unsub = this.auth.onAuthStateChanged(() => {
                this.currentUser = this.auth.currentUser;
                if (this.currentUser) {
                    unsub && unsub();
                    resolve(true);
                } else if (Date.now() - started > timeoutMs) {
                    unsub && unsub();
                    resolve(false);
                }
            });
        });
        if (!this.currentUser) throw new Error('Not authenticated');
        return true;
    }

    /**
     * Create a new conversation between users
     */
    async createConversation(participants, jobId = null, initialMessage = null) {
        try {
            await this.ensureReadyForWrites();
            
            // Ensure current user is in participants
            if (!participants.includes(this.currentUser.email)) {
                participants.push(this.currentUser.email);
            }
            
            // Sort participants to create consistent conversation IDs
            const sortedParticipants = participants.sort();
            let conversationId = sortedParticipants.join('_').replace(/[^a-zA-Z0-9_]/g, '_');

            // Special case: broadcasts use a dedicated conversation id to avoid clashing with any single-user threads
            if (sortedParticipants.length === 1 && String(sortedParticipants[0]).toLowerCase() === 'broadcasts') {
                conversationId = 'broadcasts_all_users';
            }
            
            const conversationData = {
                id: conversationId,
                participants: sortedParticipants,
                jobId: jobId,
                lastMessage: initialMessage || '',
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                readStatus: this.createReadStatus(participants),
                isActive: true
            };
            
            // Create conversation document
            await this.firestore.collection('directMessages').doc(conversationId).set(conversationData);
            
            // Send initial message if provided
            if (initialMessage) {
                await this.sendMessage(conversationId, initialMessage);
            }
            
            console.log('✅ Conversation created:', conversationId);
            return conversationId;
            
        } catch (error) {
            console.error('❌ Failed to create conversation:', error);
            throw error;
        }
    }

    /**
     * Send a message to a conversation
     */
    async sendMessage(conversationId, content, attachments = []) {
        try {
            await this.ensureReadyForWrites();
            
            const messagesRef = this.firestore
                .collection('directMessages')
                .doc(conversationId)
                .collection('messages');
            const messageRef = messagesRef.doc();
            const messageData = {
                id: messageRef.id,
                senderId: this.currentUser.email,
                content: content,
                attachments: attachments,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'sent',
                readBy: [this.currentUser.email]
            };
            
            // Ensure participants include current sender (and admin identity if applicable)
            try {
                // Skip mutating participants for the dedicated broadcasts thread
                if (conversationId !== 'broadcasts_all_users') {
                    const convRef = this.firestore.collection('directMessages').doc(conversationId);
                    const updates = { participants: firebase.firestore.FieldValue.arrayUnion(this.currentUser.email) };
                    await convRef.set(updates, { merge: true });
                }
            } catch(_) {}

            // Add message to conversation
            await messageRef.set(messageData);
            
            // Update conversation last message
            await this.firestore.collection('directMessages').doc(conversationId).update({
                lastMessage: content,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Message sent to conversation:', conversationId);
            return messageData.id;
            
        } catch (error) {
            console.error('❌ Failed to send message:', error?.message || error, error);
            throw error;
        }
    }

    /**
     * Archive a message and remove it from the live thread
     */
    async archiveAndDeleteMessage(conversationId, message) {
        try {
            await this.ensureReadyForWrites();
            if (!message || !message.id) throw new Error('Message missing id');
            // Do not allow archiving broadcast thread messages from user UI guard
            const convDoc = await this.firestore.collection('directMessages').doc(conversationId).get();
            const participants = (convDoc.exists && convDoc.data() && Array.isArray(convDoc.data().participants)) ? convDoc.data().participants : [];
            if (participants.some(e => String(e).toLowerCase() === 'broadcasts')) {
                throw new Error('Broadcast messages cannot be deleted');
            }

            const archiveId = `${conversationId}_${message.id}`;
            const archivePayload = {
                ...message,
                conversationId,
                archivedAt: firebase.firestore.FieldValue.serverTimestamp(),
                archivedBy: this.currentUser?.email || 'unknown'
            };
            await this.firestore.collection('archivedMessages').doc(archiveId).set(archivePayload);
            await this.firestore.collection('directMessages').doc(conversationId).collection('messages').doc(message.id).delete();
            return true;
        } catch (e) {
            console.error('❌ Failed to archive/delete message:', e);
            throw e;
        }
    }

    /**
     * Upload file attachment
     */
    async uploadAttachment(conversationId, messageId, file) {
        try {
            await this.ensureReadyForWrites();
            
            const fileName = `${Date.now()}_${file.name}`;
            const storageRef = this.storage.ref().child(`messageAttachments/${conversationId}/${messageId}/${fileName}`);
            
            const uploadTask = storageRef.put(file);
            
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // Progress tracking
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('📤 Upload progress:', progress + '%');
                    },
                    (error) => {
                        console.error('❌ Upload failed:', error);
                        reject(error);
                    },
                    async () => {
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            console.log('✅ File uploaded:', downloadURL);
                            resolve({
                                name: file.name,
                                url: downloadURL,
                                size: file.size,
                                type: file.type
                            });
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
            
        } catch (error) {
            console.error('❌ Failed to upload attachment:', error);
            throw error;
        }
    }

    /**
     * Load conversations for current user
     */
    async loadUserConversations() {
        try {
            if (!this.currentUser) return [];
            
            // Query in two steps to avoid composite index requirement:
            // Fetch active conversations first (no orderBy to avoid index),
            // then filter by participant (unless admin) and sort client-side by lastMessageTime desc.
            const activeQuery = this.firestore
                .collection('directMessages')
                .where('isActive', '==', true);
            
            const snapshot = await activeQuery.get();
            this.conversations.clear();

            const matching = [];
            const adminEmails = (window.FirebaseConfig && window.FirebaseConfig.getAdminUsers) ? window.FirebaseConfig.getAdminUsers() : [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const participants = Array.isArray(data.participants) ? data.participants : [];
                const isAdminConversation = participants.some(e => adminEmails.includes(String(e).toLowerCase()));
                const isBroadcast = participants.some(e => String(e).toLowerCase() === 'broadcasts');
                let include = false;
                if (this.isAdmin) {
                    include = true; // admins see all conversations
                } else if (this.currentUser) {
                    include = participants.includes(this.currentUser.email) || isBroadcast; // users see only their own threads + broadcasts
                }
                if (include) {
                    const entry = { id: doc.id, ...data, unreadCount: this.getUnreadCount(data.readStatus) };
                    // Improve unread counts best-effort
                    try {
                        const sinceTs = data.readStatus && this.currentUser ? data.readStatus[this.currentUser.email] : null;
                        this.countUnreadSince(doc.id, sinceTs).then((n) => { entry.unreadCount = n; }).catch(()=>{});
                    } catch(_) {}
                    matching.push(entry);
                }
            });

            // Sort by lastMessageTime descending (missing/null last)
            matching.sort((a, b) => {
                const ta = a.lastMessageTime && a.lastMessageTime.toMillis ? a.lastMessageTime.toMillis() : 0;
                const tb = b.lastMessageTime && b.lastMessageTime.toMillis ? b.lastMessageTime.toMillis() : 0;
                return tb - ta;
            });

            for (const conv of matching) {
                this.conversations.set(conv.id, conv);
            }
            
            console.log('✅ Loaded conversations:', this.conversations.size);
            return Array.from(this.conversations.values());
            
        } catch (error) {
            console.error('❌ Failed to load conversations:', error);
            return [];
        }
    }

    /**
     * Load messages for a conversation
     */
    async loadMessages(conversationId, limit = 50) {
        try {
            const query = this.firestore
                .collection('directMessages')
                .doc(conversationId)
                .collection('messages')
                .orderBy('timestamp', 'desc')
                .limit(limit);
            
            const snapshot = await query.get();
            const messages = [];
            
            snapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Mark messages as read
            await this.markMessagesAsRead(conversationId);
            
            return messages.reverse(); // Return in chronological order
            
        } catch (error) {
            console.error('❌ Failed to load messages:', error);
            return [];
        }
    }

    /**
     * Listen for real-time message updates
     */
    listenToMessages(conversationId, callback) {
        try {
            // Remove existing listener
            if (this.messageListeners.has(conversationId)) {
                this.messageListeners.get(conversationId)();
            }
            
            const unsubscribe = this.firestore
                .collection('directMessages')
                .doc(conversationId)
                .collection('messages')
                .orderBy('timestamp', 'desc')
                .onSnapshot((snapshot) => {
                    const messages = [];
                    snapshot.forEach(doc => {
                        messages.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    callback(messages.reverse());
                });
            
            this.messageListeners.set(conversationId, unsubscribe);
            return unsubscribe;
        } catch (error) {
            console.error('❌ Failed to set up message listener:', error);
        }
    }

    /**
     * Listen for real-time conversation list updates
     */
    listenToConversations(callback) {
        try {
            if (this.conversationsUnsubscribe) {
                this.conversationsUnsubscribe();
            }

            if (!this.firestore) {
                throw new Error('Firestore not ready');
            }

            const queryRef = this.firestore
                .collection('directMessages')
                .where('isActive', '==', true);

            this.conversationsUnsubscribe = queryRef.onSnapshot((snapshot) => {
                const list = [];
                const adminEmails = (window.FirebaseConfig && window.FirebaseConfig.getAdminUsers) ? window.FirebaseConfig.getAdminUsers() : [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const participants = Array.isArray(data.participants) ? data.participants : [];
                    const isAdminConversation = participants.some(e => adminEmails.includes(String(e).toLowerCase()));
                    const isBroadcast = participants.some(e => String(e).toLowerCase() === 'broadcasts');
                    let include = false;
                    if (this.isAdmin) {
                        include = true;
                    } else if (this.currentUser) {
                        include = participants.includes(this.currentUser.email) || isBroadcast;
                    }
                    if (include) {
                        list.push({ id: doc.id, ...data, unreadCount: this.getUnreadCount(data.readStatus) });
                    }
                });

                list.sort((a, b) => {
                    const ta = a.lastMessageTime && a.lastMessageTime.toMillis ? a.lastMessageTime.toMillis() : 0;
                    const tb = b.lastMessageTime && b.lastMessageTime.toMillis ? b.lastMessageTime.toMillis() : 0;
                    return tb - ta;
                });

                callback(list);
            });

            return this.conversationsUnsubscribe;
        } catch (error) {
            console.error('❌ Failed to set up conversations listener:', error);
        }
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(conversationId) {
        try {
            if (!this.currentUser) return;
            
            const conversationRef = this.firestore.collection('directMessages').doc(conversationId);
            const readStatus = {};
            readStatus[`readStatus.${this.currentUser.email}`] = firebase.firestore.FieldValue.serverTimestamp();
            
            await conversationRef.update(readStatus);
            
        } catch (error) {
            console.error('❌ Failed to mark messages as read:', error);
        }
    }

    /**
     * Search messages
     */
    async searchMessages(query, conversationId = null) {
        try {
            let messagesQuery = this.firestore.collectionGroup('messages');
            
            if (conversationId) {
                messagesQuery = this.firestore
                    .collection('directMessages')
                    .doc(conversationId)
                    .collection('messages');
            }
            
            // Note: Firestore doesn't support full-text search natively
            // This is a basic implementation - consider using Algolia for production
            const snapshot = await messagesQuery
                .where('content', '>=', query)
                .where('content', '<=', query + '\uf8ff')
                .limit(20)
                .get();
            
            const results = [];
            snapshot.forEach(doc => {
                results.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return results;
            
        } catch (error) {
            console.error('❌ Failed to search messages:', error);
            return [];
        }
    }

    /**
     * Get or create conversation with admin
     */
    async getOrCreateAdminConversation() {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            
            const adminEmails = window.FirebaseConfig.getAdminUsers();
            // Prefer the first admin as the canonical endpoint
            const primaryAdmin = adminEmails[0];
            const participants = [this.currentUser.email, primaryAdmin];
            
            const conversationId = participants.sort().join('_').replace(/[^a-zA-Z0-9_]/g, '_');
            
            // Check if conversation exists
            const conversationDoc = await this.firestore
                .collection('directMessages')
                .doc(conversationId)
                .get();
            
            if (conversationDoc.exists) {
                // Ensure canonical participants are set
                await this.firestore.collection('directMessages').doc(conversationId).set({
                    participants: [this.currentUser.email, primaryAdmin]
                }, { merge: true });
                return conversationId;
            } else {
                // Create new conversation
                return await this.createConversation(participants);
            }
            
        } catch (error) {
            console.error('❌ Failed to get/create admin conversation:', error);
            throw error;
        }
    }

    /**
     * Get conversation with specific user
     */
    async getOrCreateUserConversation(userEmail) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            if (!this.isAdmin) throw new Error('Only admins can create user conversations');
            
            const participants = [this.currentUser.email, userEmail];
            const conversationId = participants.sort().join('_').replace(/[^a-zA-Z0-9_]/g, '_');
            
            // Check if conversation exists
            const conversationDoc = await this.firestore
                .collection('directMessages')
                .doc(conversationId)
                .get();
            
            if (conversationDoc.exists) {
                return conversationId;
            } else {
                // Create new conversation
                return await this.createConversation(participants);
            }
            
        } catch (error) {
            console.error('❌ Failed to get/create user conversation:', error);
            throw error;
        }
    }

    /**
     * Get or create direct conversation between current user and another user (non-admin path)
     */
    async getOrCreateDirectConversation(targetEmail) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            if (!targetEmail) throw new Error('Target email required');

            const participants = [this.currentUser.email, targetEmail];
            const conversationId = participants.sort().join('_').replace(/[^a-zA-Z0-9_]/g, '_');

            const conversationDoc = await this.firestore
                .collection('directMessages')
                .doc(conversationId)
                .get();

            if (conversationDoc.exists) {
                return conversationId;
            } else {
                return await this.createConversation(participants);
            }
        } catch (error) {
            console.error('❌ Failed to get/create direct conversation:', error);
            throw error;
        }
    }

    /**
     * Helper methods
     */
    createReadStatus(participants) {
        const readStatus = {};
        participants.forEach(email => {
            readStatus[email] = null; // null means unread
        });
        return readStatus;
    }

    getUnreadCount(readStatus) {
        if (!readStatus || !this.currentUser) return 0;
        // If we've never read the thread, show at least 1 as a nudge; accurate counts are computed asynchronously
        return readStatus[this.currentUser.email] === null ? 1 : 0;
    }

    async countUnreadSince(conversationId, sinceTs, maxToScan = 50) {
        try {
            const messagesRef = this.firestore
                .collection('directMessages')
                .doc(conversationId)
                .collection('messages')
                .orderBy('timestamp', 'desc')
                .limit(maxToScan);
            const snapshot = await messagesRef.get();
            const myEmail = this.currentUser?.email;
            let count = 0;
            snapshot.forEach(doc => {
                const data = doc.data() || {};
                const ts = data.timestamp && data.timestamp.toMillis ? data.timestamp.toMillis() : 0;
                const cutoff = sinceTs && sinceTs.toMillis ? sinceTs.toMillis() : 0;
                if (ts > cutoff && data.senderId !== myEmail) count++;
            });
            return count;
        } catch (e) {
            console.warn('countUnreadSince error', e);
            return 0;
        }
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
        
        return date.toLocaleDateString();
    }

    cleanup() {
        // Remove all listeners
        this.messageListeners.forEach(unsubscribe => unsubscribe());
        this.messageListeners.clear();
        this.conversations.clear();
    }
}

// Initialize messaging service when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.MessagingService = new MessagingService();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessagingService;
}
