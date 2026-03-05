CREATE TABLE IF NOT EXISTS survey_rating (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id VARCHAR(64) NOT NULL,
  reception INT NOT NULL,
  consultant INT NOT NULL,
  photographer INT NOT NULL,
  doctor INT NOT NULL,
  nurse INT NOT NULL,
  wax_designer INT NOT NULL,
  audio_url VARCHAR(512) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

