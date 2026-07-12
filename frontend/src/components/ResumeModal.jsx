import React from "react";

export default function ResumeModal({ isOpen, onClose, resumeUrl, studentName }) {
  if (!isOpen) return null;

  // Google Drive url converter for embedding
  const getEmbedUrl = (url) => {
    if (!url) return "";
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname.includes("drive.google.com")) {
        // Extract file ID from path /file/d/FILE_ID/view
        const match = parsedUrl.pathname.match(/\/d\/([^/]+)/);
        if (match && match[1]) {
          return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
        // Extract file ID from query parameter ?id=FILE_ID
        const idParam = parsedUrl.searchParams.get("id");
        if (idParam) {
          return `https://drive.google.com/file/d/${idParam}/preview`;
        }
      }
    } catch (e) {
      console.warn("Invalid resume URL provided:", url);
    }
    return url;
  };

  const embedUrl = getEmbedUrl(resumeUrl);
  const isGoogleDrive = resumeUrl && resumeUrl.includes("drive.google.com");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-surface rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl border border-outline-variant overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-container flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface">
              {studentName ? `${studentName}'s Resume` : "Resume Preview"}
            </h3>
            <p className="text-[11px] text-on-surface-variant/80 mt-0.5 truncate max-w-md">
              {resumeUrl}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {resumeUrl && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm font-variation-settings-'FILL'-1">open_in_new</span>
                <span>Open Direct</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-surface-container-lowest p-2 relative flex items-center justify-center">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full rounded-lg border border-outline-variant bg-white"
              title="Resume Document"
              allow="autoplay"
            />
          ) : (
            <div className="text-center p-8">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3 block">
                picture_as_pdf
              </span>
              <p className="text-sm font-semibold text-on-surface">No Resume Link Provided</p>
              <p className="text-xs text-on-surface-variant mt-1">This applicant has not uploaded a valid resume link.</p>
            </div>
          )}

          {/* Helper message for google drive iframe block */}
          {isGoogleDrive && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-inverse-surface text-inverse-on-surface text-[10px] rounded-lg shadow-md font-medium tracking-wide flex items-center gap-1.5 pointer-events-none opacity-80">
              <span className="material-symbols-outlined text-xs">info</span>
              <span>Must set permissions to "Anyone with link can view" on Google Drive.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
