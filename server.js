const express = require('express');
const net = require('net');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

app.post('/print', (req, res) => {
    const { ip, port, data } = req.body;
    
    const client = new net.Socket();
    
    client.connect(port || 9100, ip, () => {
        console.log('متصل بالطابعة:', ip);
        const buffer = Buffer.from(data);
        client.write(buffer);
        
        setTimeout(() => {
            client.destroy();
            res.json({ success: true, message: 'تم الإرسال للطابعة' });
        }, 1000);
    });
    
    client.on('error', (err) => {
        console.error('خطأ في الاتصال:', err);
        res.status(500).json({ success: false, message: err.message });
    });
});

app.post('/test-connection', (req, res) => {
    const { ip, port } = req.body;
    
    const client = new net.Socket();
    client.setTimeout(3000);
    
    client.connect(port || 9100, ip, () => {
        console.log('نجح الاتصال بالطابعة');
        client.destroy();
        res.json({ success: true, message: 'الطابعة متصلة' });
    });
    
    client.on('timeout', () => {
        client.destroy();
        res.status(500).json({ success: false, message: 'انتهت مهلة الاتصال' });
    });
    
    client.on('error', (err) => {
        res.status(500).json({ success: false, message: 'فشل الاتصال: ' + err.message });
    });
});

app.listen(PORT, () => {
    console.log(`خادم الطباعة يعمل على المنفذ ${PORT}`);
});
