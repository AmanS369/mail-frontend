import React, { useState } from 'react';
import api from '../services/api';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function CsvImport({ setCurrentPage }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview & Confirm, 4: Done
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    name: '',
    email: '',
    company: '',
    designation: '',
    linkedinUrl: '',
  });
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);

  // Step 1: Handle File Selection & Parse
  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setError('');

    const formData = new FormData();
    formData.append('file', selected);

    try {
      setLoading(true);
      const res = await api.post('/contacts/csv-parse', formData);
      setHeaders(res.data.headers || []);
      setMapping(res.data.suggestedMapping || {});
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Proceed to Validation Preview
  const handleProceedToPreview = async () => {
    if (!mapping.name || !mapping.email || !mapping.company || !mapping.designation) {
      setError('Please map all required fields: Name, Email, Company, and Designation.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/contacts/csv-preview', formData);
      setPreviewData(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle individual row exclusion
  const toggleRowExclusion = (index) => {
    if (!previewData) return;
    const updatedRows = [...previewData.rows];
    updatedRows[index].excluded = !updatedRows[index].excluded;
    setPreviewData({
      ...previewData,
      rows: updatedRows,
    });
  };

  // Step 3: Confirm Import
  const handleConfirmImport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/contacts/import', {
        rows: previewData.rows,
      });
      setImportResult(res.data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">CSV Contacts Import</h2>
        <p className="text-sm text-slate-500">
          Upload a spreadsheet of contacts, map fields, preview deduplication, and import safely.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        {[
          { num: 1, label: 'Upload CSV' },
          { num: 2, label: 'Map Columns' },
          { num: 3, label: 'Validate & Exclude' },
          { num: 4, label: 'Completed' },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s.num
                  ? 'bg-indigo-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </span>
            <span
              className={`text-sm font-medium ${
                step === s.num ? 'text-slate-900' : 'text-slate-500'
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Upload */}
      {step === 1 && (
        <div className="bg-white p-10 rounded-2xl border-2 border-dashed border-slate-300 text-center hover:border-indigo-400 transition-colors">
          <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Select your CSV File</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Columns for Name, Email, Company, and Designation will be auto-detected.
          </p>
          <label className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors">
            <span>Browse Files</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Map CSV Columns</h3>
              <p className="text-xs text-slate-500">
                Match your CSV headers to the outreach contact properties.
              </p>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              File: {file?.name}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'name', label: 'Full Name *', required: true },
              { key: 'email', label: 'Email Address *', required: true },
              { key: 'company', label: 'Company Name *', required: true },
              { key: 'designation', label: 'Designation / Role *', required: true },
              { key: 'linkedinUrl', label: 'LinkedIn URL (Optional)', required: false },
            ].map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  {field.label}
                </label>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose Column --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleProceedToPreview}
              disabled={loading}
              className="inline-flex items-center px-5 py-2 bg-indigo-600 rounded-lg text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <span>{loading ? 'Validating...' : 'Validate & Preview'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview & Deduplication & Row Exclusion */}
      {step === 3 && previewData && (
        <div className="space-y-5">
          {/* Summary counters */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs text-slate-500">Total Rows</span>
              <p className="text-xl font-bold text-slate-900">{previewData.totalRows}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs text-emerald-700 font-medium">Ready to Import</span>
              <p className="text-xl font-bold text-emerald-800">
                {previewData.rows.filter((r) => !r.excluded).length}
              </p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
              <span className="text-xs text-amber-700 font-medium">Duplicates / In DB</span>
              <p className="text-xl font-bold text-amber-800">{previewData.duplicateCount}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
              <span className="text-xs text-rose-700 font-medium">Invalid / Suppressed</span>
              <p className="text-xl font-bold text-rose-800">
                {previewData.invalidCount + previewData.suppressedCount}
              </p>
            </div>
          </div>

          {/* Rows table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                Row Validation & Exclusion
              </span>
              <span className="text-xs text-slate-500">
                Uncheck any row you wish to exclude from import
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 sticky top-0 text-slate-500 uppercase font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Import?</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3">Status / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`${
                        r.excluded ? 'bg-slate-50/80 opacity-60' : 'hover:bg-indigo-50/30'
                      }`}
                    >
                      <td className="py-2 px-3">
                        <input
                          type="checkbox"
                          checked={!r.excluded}
                          onChange={() => toggleRowExclusion(i)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">{r.data.name || '—'}</td>
                      <td className="py-2 px-3 text-slate-700">{r.data.email || '—'}</td>
                      <td className="py-2 px-3">{r.data.company || '—'}</td>
                      <td className="py-2 px-3">{r.data.designation || '—'}</td>
                      <td className="py-2 px-3">
                        {r.isDuplicate && (
                          <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium mr-1">
                            Duplicate ({r.duplicateType})
                          </span>
                        )}
                        {r.isSuppressed && (
                          <span className="inline-flex items-center text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded text-[11px] font-medium mr-1">
                            Suppressed
                          </span>
                        )}
                        {!r.isValid && (
                          <span className="inline-flex items-center text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium mr-1">
                            {r.errors.join(', ')}
                          </span>
                        )}
                        {r.isValid && !r.isDuplicate && !r.isSuppressed && (
                          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={loading || previewData.rows.filter((r) => !r.excluded).length === 0}
              className="inline-flex items-center px-6 py-2.5 bg-indigo-600 rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Importing...' : `Confirm Import (${previewData.rows.filter((r) => !r.excluded).length} contacts)`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Report */}
      {step === 4 && importResult && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Import Completed!</h3>
          <p className="text-sm text-slate-600">
            Successfully imported{' '}
            <span className="font-semibold text-slate-900">{importResult.importedCount}</span> contacts.
            {importResult.skippedCount > 0 && (
              <span> (Skipped {importResult.skippedCount} rows)</span>
            )}
          </p>
          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => setCurrentPage('contacts')}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Contacts
            </button>
            <button
              onClick={() => setCurrentPage('compose')}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
            >
              Compose Outreach Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

