export default function QuestionsModal({
  open,
  questions = [],
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionAnswers,
  setQuestionAnswers,
  onClose,
  onSubmit
}) {
  if (!open) return null;

  const handleChange = (e) => {
    const val = e.target.value;
    setQuestionAnswers((prev) => ({ ...prev, [currentQuestionIndex]: val }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="questions-modal">
      <div className="questions-modal-content">
        <div className="questions-modal-header">
          <h2 className="questions-modal-title">Additional Information Needed</h2>
          <button className="questions-modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="questions-modal-description">
          To create a detailed listing, please answer the following questions.
        </p>
        <div className="questions-modal-question">
          <div>Question {currentQuestionIndex + 1} of {questions.length}</div>
          <h3>{questions[currentQuestionIndex]}</h3>
          <textarea
            value={questionAnswers[currentQuestionIndex] || ''}
            onChange={handleChange}
            className="questions-modal-textarea"
          />
        </div>
        <div className="questions-modal-actions">
          <button className="questions-modal-btn cancel" onClick={onClose}>Cancel</button>
          {currentQuestionIndex > 0 && (
            <button className="questions-modal-btn secondary" onClick={handlePrev}>Previous</button>
          )}
          <button className="questions-modal-btn primary" onClick={handleNext}>
            {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

