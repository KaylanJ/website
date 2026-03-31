'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState("");

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("TRANSMITTING...");

    const { error } = await supabase.from('messages').insert([{
      sender_name: formData.name,
      sender_email: formData.email,
      subject: formData.subject,
      content: formData.message
    }]);

    if (error) {
      setStatus("ERROR: UPLINK_FAILED");
    } else {
      setStatus("SUCCESS: MESSAGE_ENCRYPTED_AND_SENT");
      setFormData({ name: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <div className="p-3 bg-gray-900 min-h-screen text-white font-mono flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-4">
        <Link href="/" className="nes-btn is-error text-[7px]">&lt; HOME</Link>
        
        <section className="nes-container with-title is-dark">
          <p className="title text-[7px]">SECURE_UPLINK</p>
          <form onSubmit={sendMessage} className="space-y-3">
            <div className="nes-field">
              <label className="text-[7px]">NAME</label>
              <input required className="nes-input is-dark text-[7px]" value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="nes-field">
              <label className="text-[7px]">EMAIL</label>
              <input required type="email" className="nes-input is-dark text-[7px]" value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="nes-field">
              <label className="text-[7px]">SUBJECT</label>
              <input required className="nes-input is-dark text-[7px]" value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})} />
            </div>

            <div className="nes-field">
              <label className="text-[7px]">MESSAGE</label>
              <textarea required className="nes-textarea is-dark text-[7px] h-24" value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})} />
            </div>

            <button type="submit" className="nes-btn is-primary w-full text-[7px]">SEND</button>
            {status && <p className="nes-text is-warning text-[7px] text-center mt-2">{status}</p>}
          </form>
        </section>
      </div>
    </div>
  );
}