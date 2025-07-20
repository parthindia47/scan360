import React, { useEffect, useState } from 'react';

function Contact() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `Contact Us | Scan360`;

    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
      <p className="mb-4 text-lg">
        We’d love to hear from you!
      </p>
      <p className="mb-6">
        If you have any questions, suggestions, or feedback related to <strong>Scan360</strong>,
        feel free to reach out to us anytime.
      </p>
      <div className="bg-blue-50 p-4 rounded border border-blue-200">
        <p className="text-gray-700 font-medium">
          📧 Email us at:{' '}
          <a href="mailto:support@scan360.in" className="text-blue-600 underline">
            support@scan360.in
          </a>
        </p>
      </div>
    </div>
  );
}

export default Contact;
