export default function PaymentModal({

    visible,

    amount,

    note,

    onAmountChange,

    onNoteChange,

    onCancel,

    onSave

}) {

    if (!visible) return null;

    return (

        <div className="modal-overlay">

            <div className="payment-modal">

                <h2>

                    Registrar pagamento

                </h2>

                <label>

                    Valor

                </label>

                <input

                    type="number"

                    step="0.01"

                    value={amount}

                    onChange={(e)=>onAmountChange(e.target.value)}

                />

                <label>

                    Observação

                </label>

                <textarea

                    rows="3"

                    value={note}

                    onChange={(e)=>onNoteChange(e.target.value)}

                />

                <div className="modal-buttons">

                    <button

                        className="button secondary"

                        onClick={onCancel}

                    >

                        Cancelar

                    </button>

                    <button

                        className="button"

                        onClick={onSave}

                    >

                        Salvar

                    </button>

                </div>

            </div>

        </div>

    );

}