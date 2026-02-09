// src/pages/email.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import clsx from 'clsx';
import { Editor } from '@tinymce/tinymce-react';

const BACKEND_URL =  import.meta.env.VITE_BACKEND_URL;

export default function Emailtemp() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('desktop'); // desktop/mobile
  const [darkMode, setDarkMode] = useState(false);
  const [editorMode, setEditorMode] = useState(false); // toggle between preview & editor

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/templates/${id}`);
        setTemplate(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!template) return <div className="p-8 text-center text-red-500">Template not found</div>;

  const downloadHtml = () => {
    const htmlContent = editorRef.current?.getContent() || '';
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.subject || 'template'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={clsx(
      "min-h-screen flex flex-col p-4 transition-colors duration-300",
      darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    )}>

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className={clsx(
            "px-4 py-2 font-medium transition-colors rounded-sm shadow-sm",
            darkMode ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-indigo-500 hover:bg-indigo-600 text-white"
          )}
        >
          ← Back
        </button>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('desktop')}
            className={clsx(
              "px-3 py-1 border font-medium transition-colors rounded-sm",
              viewMode === 'desktop'
                ? darkMode ? "bg-indigo-600 text-white border-indigo-600" : "bg-indigo-500 text-white border-indigo-500"
                : darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            )}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={clsx(
              "px-3 py-1 border font-medium transition-colors rounded-sm",
              viewMode === 'mobile'
                ? darkMode ? "bg-indigo-600 text-white border-indigo-600" : "bg-indigo-500 text-white border-indigo-500"
                : darkMode ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            )}
          >
            Mobile
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={clsx(
              "px-3 py-1 border font-medium transition-colors rounded-sm",
              darkMode ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
            )}
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={() => setEditorMode(!editorMode)}
            className={clsx(
              "px-3 py-1 border font-medium transition-colors rounded-sm",
              darkMode ? "bg-green-600 hover:bg-green-500 text-white border-green-600" : "bg-green-500 hover:bg-green-600 text-white border-green-500"
            )}
          >
            {editorMode ? 'Preview Mode' : 'Edit Mode'}
          </button>
          {editorMode && (
            <button
              onClick={downloadHtml}
              className={clsx(
                "px-3 py-1 border font-medium transition-colors rounded-sm",
                darkMode ? "bg-yellow-600 hover:bg-yellow-500 text-white border-yellow-600" : "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
              )}
            >
              Download HTML
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6">

        {/* Sidebar Info */}
        <div className={clsx(
          "flex-shrink-0 p-6 shadow-sm transition-colors duration-300 overflow-y-auto",
          "w-full lg:w-80",
          darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
        )}>
          <h2 className="font-bold text-xl mb-4 border-b pb-2 border-gray-300 dark:border-gray-700">Email Information</h2>
          <div className="space-y-2">
            <div><span className="font-semibold">Subject:</span> {template.subject}</div>
            <div><span className="font-semibold">From:</span> {template.sender_name} &lt;{template.sender_email}&gt;</div>
            <div><span className="font-semibold">To:</span> {template.recipient_email}</div>
            <div><span className="font-semibold">Sent At:</span> {new Date(template.sent_at).toLocaleString()}</div>
          </div>

          <h3 className="mt-6 font-semibold text-lg mb-2 border-b pb-1 border-gray-300 dark:border-gray-700">Metadata</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {template.brand && <span className="px-2 py-1 text-xs font-semibold rounded-sm" style={{backgroundColor: '#e0e7ff', color: '#3730a3'}}>{template.brand}</span>}
            {template.language && <span className="px-2 py-1 text-xs font-semibold rounded-sm" style={{backgroundColor: '#d1fae5', color: '#065f46'}}>{template.language}</span>}
            {template.country && <span className="px-2 py-1 text-xs font-semibold rounded-sm" style={{backgroundColor: '#fef3c7', color: '#b45309'}}>{template.country}</span>}
          </div>
        </div>

        {/* Preview or Editor */}
        <div className="flex-1 flex flex-col gap-4 items-center">
          {editorMode ? (
            // TinyMCE Editor
            <Editor
              apiKey='o93x9wh20rmdy8wdhb8w7fdqg6zmkydirt4t2utzqf88gfha'
              onInit={(evt, editor) => editorRef.current = editor}
              initialValue={template.body_html}
              init={{
                height: viewMode === 'mobile' ? 667 : 600,
                menubar: false,
                plugins: [
                  'anchor autolink charmap codesample emoticons link lists media searchreplace table visualblocks wordcount',
                  'checklist mediaembed casechange formatpainter pageembed a11ychecker tinymcespellchecker permanentpen powerpaste advtable advcode advtemplate ai uploadcare mentions tinycomments tableofcontents footnotes mergetags autocorrect typography inlinecss markdown importword exportword exportpdf'
                ],
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                tinycomments_mode: 'embedded',
                tinycomments_author: 'Author name',
                mergetags_list: [
                  { value: 'First.Name', title: 'First Name' },
                  { value: 'Email', title: 'Email' },
                ],
                content_style: darkMode
                  ? 'body { background-color: #111827; color: #fff; }'
                  : 'body { background-color: #fff; color: #000; }'
              }}
            />
          ) : (
            // Existing Preview Frame
            <div
              className={clsx(
                "relative transition-all duration-300 shadow-lg",
                darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300",
                "flex justify-center items-center w-full"
              )}
              style={{
                width: viewMode === 'mobile' ? '400px' : '100%',
                maxWidth: '100%',
                height: viewMode === 'mobile' ? '720px' : '80vh',
                borderRadius: '12px',
                border: '1px solid',
                padding: viewMode === 'desktop' ? '16px' : '0px',
              }}
            >
              {viewMode === 'mobile' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-3 bg-gray-400 rounded-b-md z-10"></div>
              )}

              {viewMode === 'desktop' && (
                <div className={clsx(
                  "absolute inset-0 border rounded-md pointer-events-none",
                  darkMode ? "border-gray-700" : "border-gray-300"
                )}></div>
              )}

              <iframe
                title="email-preview"
                srcDoc={template.body_html}
                className="w-full h-full rounded-md"
                sandbox=""
                style={{ border: 'none', backgroundColor: darkMode ? '#111827' : '#ffffff' }}
              />
            </div>
          )}

          {/* Plain Text Snippet */}
          <div className={clsx(
            "p-4 shadow-sm rounded-sm transition-colors duration-300 whitespace-pre-line w-full",
            darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"
          )}>
            {template.text_body}
          </div>
        </div>
      </div>
    </div>
  );
}
