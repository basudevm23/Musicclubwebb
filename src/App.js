import React, { useState } from "react";

const SONGS = [
  "Rang Jo Lagyo",
  "Garaj Garaj",
  "Take On Me",
  "Dil Dhadakne Do",
  "Ainvayi Ainvayi",
  "Bring Me to Life",
];

const ALL_TIME_SLOTS = [
  "6–7 PM",
  "7–8 PM",
  "8–9 PM",
  "9–10 PM",
  "10–11 PM",
  "11–12 PM",
  "12–1 AM",
];

export default function App() {
  const [selectedSong, setSelectedSong] = useState("");
  const [name, setName] = useState("");
  const [unavailable, setUnavailable] = useState([]);
  const [reason, setReason] = useState("");
  const [seriousness, setSeriousness] = useState("Low");
  const [data, setData] = useState({});

  const seriousnessWeight = (level) =>
    level === "High" ? 100 : level === "Medium" ? 10 : 1;

  const toggleSlot = (slot) => {
    setUnavailable((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const submitConstraint = () => {
    if (!selectedSong || !name || unavailable.length === 0) return;
    const entry = { name, unavailable, reason, seriousness };
    setData((prev) => ({
      ...prev,
      [selectedSong]: [...(prev[selectedSong] || []), entry],
    }));
    setName("");
    setUnavailable([]);
    setReason("");
    setSeriousness("Low");
  };

  // Helper: generate all slot combinations (6 out of 7, leaving 1 out)
  function getSlotCombinations(slots, pick) {
    const results = [];
    function helper(temp, start) {
      if (temp.length === pick) {
        results.push([...temp]);
        return;
      }
      for (let i = start; i < slots.length; i++) {
        temp.push(slots[i]);
        helper(temp, i + 1);
        temp.pop();
      }
    }
    helper([], 0);
    return results;
  }

  // Generate all permutations of songs
  function permute(arr) {
    const results = [];
    const used = Array(arr.length).fill(false);
    function dfs(path) {
      if (path.length === arr.length) {
        results.push([...path]);
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        if (!used[i]) {
          used[i] = true;
          path.push(arr[i]);
          dfs(path);
          path.pop();
          used[i] = false;
        }
      }
    }
    dfs([]);
    return results;
  }

  const calculateSchedule = () => {
    let minScore = Infinity;
    let bestAssignment = null;

    // Try all combinations of 6 slots out of 7 (leaving one slot empty)
    const slotCombos = getSlotCombinations(ALL_TIME_SLOTS, 6);

    for (let slots of slotCombos) {
      const songPerms = permute(SONGS); // try all song orderings

      for (let perm of songPerms) {
        let totalScore = 0;
        for (let i = 0; i < perm.length; i++) {
          const song = perm[i];
          const slot = slots[i];
          const constraints = data[song] || [];
          for (let c of constraints) {
            if (c.unavailable.includes(slot)) {
              totalScore += seriousnessWeight(c.seriousness);
            }
          }
        }

        if (totalScore < minScore) {
          minScore = totalScore;
          bestAssignment = {};
          for (let i = 0; i < perm.length; i++) {
            bestAssignment[perm[i]] = slots[i];
          }
        }
      }
    }

    // If all combos involve serious conflicts, allow 12–1 AM
    if (minScore >= 100) {
      const fallbackSlots = [...ALL_TIME_SLOTS]; // allow all
      const songPerms = permute(SONGS);
      for (let slots of getSlotCombinations(fallbackSlots, 6)) {
        for (let perm of songPerms) {
          let totalScore = 0;
          for (let i = 0; i < perm.length; i++) {
            const song = perm[i];
            const slot = slots[i];
            const constraints = data[song] || [];
            for (let c of constraints) {
              if (c.unavailable.includes(slot)) {
                totalScore += seriousnessWeight(c.seriousness);
              }
            }
          }

          if (totalScore < minScore) {
            minScore = totalScore;
            bestAssignment = {};
            for (let i = 0; i < perm.length; i++) {
              bestAssignment[perm[i]] = slots[i];
            }
          }
        }
      }
    }

    return bestAssignment || {};
  };

  const schedule = calculateSchedule();
  const show12Slot = Object.values(schedule).includes("12–1 AM");

  return (
    <div style={{ textAlign: "center", padding: "30px", fontFamily: "Arial" }}>
      <h1>🎵 Song Run-Through Scheduler</h1>

      <div style={{ marginTop: "20px" }}>
        <label>Select Song: </label>
        <select
          value={selectedSong}
          onChange={(e) => setSelectedSong(e.target.value)}
        >
          <option value="">-- Choose a Song --</option>
          {SONGS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <input
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ marginTop: "10px" }}
      />

      <div style={{ marginTop: "10px" }}>
        <p>Select Unavailable Time Slots:</p>
        {(show12Slot ? ALL_TIME_SLOTS : ALL_TIME_SLOTS.slice(0, 6)).map(
          (slot) => (
            <label key={slot} style={{ marginRight: "10px" }}>
              <input
                type="checkbox"
                checked={unavailable.includes(slot)}
                onChange={() => toggleSlot(slot)}
              />
              {slot}
            </label>
          )
        )}
      </div>

      <input
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ marginTop: "10px", width: "300px" }}
      />

      <div style={{ marginTop: "10px" }}>
        <label>Seriousness: </label>
        <select
          value={seriousness}
          onChange={(e) => setSeriousness(e.target.value)}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      <button onClick={submitConstraint} style={{ marginTop: "15px" }}>
        Submit Constraint
      </button>

      <h2 style={{ marginTop: "30px" }}>📋 Final Schedule</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {SONGS.map((s) => (
          <li key={s}>
            <b>{s}</b>: {schedule[s] || "Not yet scheduled"}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "30px" }}>🧾 All Constraints</h2>
      {SONGS.map((s) => (
        <div key={s} style={{ marginBottom: "10px" }}>
          <h4>{s}</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {(data[s] || []).map((c, i) => (
              <li key={i}>
                {c.name} - Unavailable: {c.unavailable.join(", ")} (
                {c.seriousness}: {c.reason})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
