module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Internal Server Error', error: err });
};

