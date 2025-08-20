import Link from "next/link";

export default function Success() {
    return (
      <div className="chat-wrap">
        <h1 className="chat-title" style={{ marginBottom: 8 }}>Thanks — you’re Pro!</h1>
        <p className="chat-sub" style={{ marginBottom: 16 }}>
          Your account will update automatically. If you don’t see Pro yet, refresh the page.
        </p>
        <Link href="/chat" className="link">Back to Chat</Link>
      </div>
    );
  }