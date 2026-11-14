IF OBJECT_ID('dbo.tm_pen_proposal', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.tm_pen_proposal (
    id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_tm_pen_proposal PRIMARY KEY,
    id_penelitian INT NOT NULL,
    c_status_protokol VARCHAR(1) NULL,
    urutan INT NOT NULL,
    n_judul VARCHAR(255) NULL,
    n_file VARCHAR(255) NULL,
    ukuran BIGINT NULL,
    cdate DATETIME NULL,
    mdate DATETIME NULL,
    c_statusdelete VARCHAR(1) NULL
  );
  CREATE INDEX IX_tm_pen_proposal_penelitian ON dbo.tm_pen_proposal (id_penelitian, urutan);
END
