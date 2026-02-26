import { useState } from "react";

type Props = {
  onConfirm: (code: string) => void;
};

export default function CodeInput({ onConfirm }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validate = (value: string) => {
    if (!/^[a-z]+$/.test(value)) return "Solo lettere minuscole (a-z).";
    return null;
  };

  const handleSubmit = () => {
    const err = validate(code);
    if (err) return setError(err);
    setError(null);
    onConfirm(code);
  };

  return (
    <div className="flex flex-col gap-3 max-w-md">
      <label className="font-semibold">Inserisci stringa target:</label>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border rounded px-3 py-2"
        placeholder="es: abba"
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
        Conferma
      </button>
    </div>
  );
}