const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const flash = require('express-flash')
const session = require('express-session')
const multer = require('multer')

const app = express()
const upload = multer({ dest: 'img/' })

const PORT = 8000

const pool = mysql.createPool({
  host : 'localhost',
  user: 'root',
  password: '',
  database: 'phpdasar'
})

app.use(session({
  cookie: { maxAge: 60000 },
  store: new session.MemoryStore,
  saveUninitialized: true,
  resave: 'true',
  secret: 'secret'
}))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static("public"))
app.set('view engine', 'ejs');

app.use(flash());

app.get("/", (req, res) => {
  pool.getConnection((err, conn) => {
    if (err) throw err;
    console.log('Connected as ID ' + conn.threadId)
    conn.query('SELECT * FROM mahasiswa', (err, rows) => {
      conn.release()

      // console.log(typeof rows)

      if (!err) {
        res.render('index', { rows: rows, num: 1})
      } else {
        console.log(err)
      }
      // console.log('The data from mahasiswa table: \n', rows)
    })
  })
})

// cari mahasiswa
app.post("/", (req, res) => {
  pool.getConnection((err, conn) => {
    if (err) throw err;
    console.log('Connected ad ID' + conn.threadId)

    // keyword di ambil dari nama form
    let searchTerm = req.body.keyword;
    console.log(searchTerm)

    conn.query('SELECT * FROM mahasiswa WHERE nama LIKE ? OR nrp LIKE ? OR email LIKE ? OR jurusan LIKE ?', ['%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%', '%'+searchTerm+'%'], (err, rows) => {
      conn.release();

      if (!err) {
        res.render('index', { rows: rows, num: 1})
      } else {
        console.log(err)
      }
    })
  })
})

app.get("/tambah", (req, res) => {
  res.render('tambah', { alert: '' });
})

app.post("/tambah", (req, res) => {

  const { nrp, nama, email, jurusan, gambar } = req.body;

  // Connect to DB
  pool.getConnection((err, conn) => {
    if (err) throw err;   // not connected
    console.log('Connected as ID ' + conn.threadId);

    // Use the connection
    conn.query('INSERT INTO mahasiswa SET nrp = ?, nama = ?, email = ?, jurusan = ?, gambar = ?', [nrp, nama, email, jurusan, gambar], (err, rows) => {
      // When done with connection, release it
      conn.release();

      if (!err) {
        res.render('tambah', { alert: 'User telah ditambahkan' });
        // res.redirect('/');
      } else {
        console.log(err);
      }
    })
  })
})

// ubah data
app.get("/ubah/:id", (req, res) => {
  const id = req.params.id;

  pool.getConnection((err, conn) => {
    if (err) throw err;
    console.log('Connected as ID ' + conn.threadId);

    // Use the connection
    conn.query('SELECT * FROM mahasiswa WHERE id = ?', id, (err, rows) => {
      if (err) throw err;

      // if use tidak ditemukan
      if (rows.length <= 0) {
        req.flash('error', `Mahasiswa dengan id ${id} tidak ditemukan`);
        res.redirect('index');
      }
      // jika mahasiswa ditemukan
      else {
        // render to ubah.ejs
        res.render('ubah', {
          id: rows[0].id,
          nrp: rows[0].nrp,
          nama: rows[0].nama,
          email: rows[0].email,
          jurusan: rows[0].jurusan,
          gambar: rows[0].gambar,
          alert: ''
        });
      }
      console.log(rows);
    })
  })
})

app.post('/ubah/:id', (req, res) => {

  const { nrp, nama, email, jurusan, gambar } = req.body;
  const id = req.params.id;

  pool.getConnection((err, conn) => {
    if (err) throw err;
    console.log('Connected as ID ' + conn.threadId);

    conn.query('UPDATE mahasiswa SET nrp = ?, nama = ?, email = ?, jurusan = ?, gambar = ? WHERE id = ?', [nrp, nama, email, jurusan, gambar, id], (err, rows) => {
      conn.release();
      // console.log(rows);

      if(!err) {
        // res.redirect('/');
        res.render('ubah', {
          id, nrp, nama, email, jurusan, gambar,
          alert: `User dengan id ${id} berhasil diubah`
        });
      } else {
        console.log(err);
      }

    })
  })
})

// hapus user
app.get('/:id', (req, res) => {

  // Connect to DB
  pool.getConnection((err, conn) => {
    if (err) throw err;
    console.log('Connected as ID ' + conn.threadId);

    // Use the connection
    conn.query('DELETE FROM mahasiswa WHERE id = ?', [req.params.id], (err, rows) => {
      conn.release();

      if (!err) {
        let removedUser = encodeURIComponent(`${req.params.id} successfully removed.`);

        req.flash('success', `User dengan id ${req.params.id} telah dihapus`)
        res.redirect('/?removed=' + removedUser);
      } else {
        console.log(err);
      }
    })
  })
})

app.listen(PORT, () => {
  console.log(`Listening in port ${PORT}`)
})
