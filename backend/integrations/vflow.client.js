exports.trigger = async ({ workflow, data }) => {
    try {
        // Tembak API VFlow beneran di sini (sesuaikan URL/port VFlow lu)
        const response = await fetch('http://localhost:8080/api/v1/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: workflow, // Ini yang bakal mancing "trigger: InternshipSubmitted" di .yml lu
                payload: data
            })
        });

        if (!response.ok) {
            throw new Error(`Mesin VFlow nolak Bre! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log(`✅ Sukses nendang VFlow buat event: ${workflow}`);
        return result;

    } catch (error) {
        console.error("❌ VFlow belum nyala atau gagal konek:", error.message);
        
        // JANGAN DIHAPUS: Ini kodingan temen lu buat "fallback/cadangan" 
        // Kalau mesin VFlow lu lagi mati, backend tetep jalan pake data bohong-bohongan
        return {
            workflow,
            status: "executed (dummy fallback)",
            data
        };
    }
};