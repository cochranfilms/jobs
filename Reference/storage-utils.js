/**
 * Firebase Storage Utilities
 */

(function(){
    const StorageUtils = {
        async ensureReady() {
            if (!window.FirebaseConfig) throw new Error('FirebaseConfig not found');
            await window.FirebaseConfig.waitForInit();
            if (typeof firebase === 'undefined' || !firebase.storage) {
                throw new Error('Firebase Storage SDK not loaded');
            }
            return true;
        },

        sanitizeFilename(name) {
            return String(name || 'file')
                .replace(/[^a-zA-Z0-9._-]/g, '-')
                .replace(/-+/g, '-')
                .toLowerCase();
        },

        buildPath({ ownerEmail, folder = 'portfolios', filename }) {
            const email = String(ownerEmail || 'unknown').toLowerCase().replace(/[^a-z0-9@._-]/g, '-');
            const ts = Date.now();
            const safeName = this.sanitizeFilename(filename);
            return `${folder}/${email}/${ts}-${safeName}`;
        },

        dataURLToBlob(dataURL) {
            const parts = dataURL.split(',');
            const meta = parts[0];
            const base64 = parts[1];
            const mime = (meta.match(/data:(.*);base64/) || [])[1] || 'application/octet-stream';
            const binary = atob(base64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
            return new Blob([array], { type: mime });
        },

        async uploadFile(input, options = {}) {
            await this.ensureReady();
            const storage = firebase.storage();

            let fileObj;
            let contentType = 'application/octet-stream';
            if (typeof input === 'string' && input.startsWith('data:')) {
                const blob = this.dataURLToBlob(input);
                fileObj = blob;
                contentType = blob.type || contentType;
            } else {
                fileObj = input; // File or Blob
                contentType = (input && input.type) || contentType;
            }

            const name = options.filename || (input && input.name) || 'upload.bin';
            const fullPath = this.buildPath({ ownerEmail: options.ownerEmail, folder: options.folder, filename: name });
            const bucketURL = options.bucketURL || (typeof window !== 'undefined' ? window.FIREBASE_BUCKET_URL : null);
            const baseRef = bucketURL ? storage.refFromURL(bucketURL) : storage.ref();
            const ref = baseRef.child(fullPath);

            const metadata = { contentType };
            return new Promise((resolve, reject) => {
                const task = ref.put(fileObj, metadata);
                task.on('state_changed', (snapshot) => {
                    if (typeof options.onProgress === 'function') {
                        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        options.onProgress({ percent: Math.round(pct), snapshot });
                    }
                }, (error) => {
                    reject(error);
                }, async () => {
                    try {
                        const downloadURL = await task.snapshot.ref.getDownloadURL();
                        resolve({
                            path: fullPath,
                            downloadURL,
                            size: task.snapshot.totalBytes,
                            contentType
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            });
        },

        async uploadFiles(files = [], options = {}) {
            const results = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // eslint-disable-next-line no-await-in-loop
                const out = await this.uploadFile(file, {
                    ...options,
                    filename: file && file.name ? file.name : `file-${i}`,
                    onProgress: (p) => {
                        if (typeof options.onProgress === 'function') options.onProgress({ index: i, ...p });
                    }
                });
                results.push(out);
            }
            return results;
        }
    };

    window.StorageUtils = StorageUtils;
})();


