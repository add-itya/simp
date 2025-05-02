import { useEffect, useState } from "react";
import { fetchQuakes, QuakeSummary } from "./api";
import Map from "./components/Map";
import Timeline from "./components/Timeline";
import { motion } from "framer-motion";

export default function App() {
  const [minMag, setMinMag] = useState(4.5);
  const [data, setData] = useState<QuakeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [magRange, setMagRange] = useState({ min: 4.0, max: 8.0 });

  useEffect(() => {
    fetchQuakes().then(quakes => {
      const magnitudes = quakes.map(q => q.mag);
      const min = Math.min(...magnitudes);
      const max = Math.max(...magnitudes);
      
      setMagRange({ min, max });
      setMinMag(min);
      setData(quakes);
      setLoading(false);
    });
  }, []);

  // Filter data based on minimum magnitude
  const filteredData = data.filter(q => 
    Number.parseFloat(q.mag.toFixed(1)) >= Number.parseFloat(minMag.toFixed(1))
  );
  
  // Log filtering results with more precise information
  useEffect(() => {
    if (data.length) {
      console.log(`Filtering ${data.length} earthquakes at magnitude ${minMag}+: ${filteredData.length} matches`);
      if (filteredData.length > 0) {
        console.log('Magnitudes included:', filteredData.map(q => Number.parseFloat(q.mag.toFixed(1))).sort().join(', '));
      }
    }
  }, [data, minMag, filteredData]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
            Global Earthquake Monitor
          </h1>
          <p className="text-lg text-slate-300 flex items-center justify-center gap-2">
            Last 30 Days
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </p>
        </motion.header>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between px-4">
            <label className="text-slate-300">
              Minimum Magnitude: {minMag.toFixed(1)}
            </label>
            <input
              type="range"
              min={magRange.min}
              max={magRange.max}
              step="0.1"
              value={minMag}
              onChange={(e) => setMinMag(parseFloat(e.target.value))}
              className="w-48 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-400"
            />
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-400 border-t-transparent"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
              >
                <Timeline data={filteredData} minMag={minMag} />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="h-[60vh] md:h-[70vh] rounded-xl overflow-hidden border border-slate-700 shadow-lg relative z-0"
              >
                <Map data={filteredData} />
              </motion.div>
            </div>
          )}
        </motion.div>

        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center text-slate-400 text-sm"
        >
          Data provided by USGS Earthquake Catalog
        </motion.footer>
      </div>
    </div>
  );
}