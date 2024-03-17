export const generateImageFilename = (filename) => {
  const uploadDate = new Date().getTime();
  const newFilename = filename.replace(/\s/g, "_");
  const result = `${uploadDate}_${newFilename}`;
  return result;
};

export const generateImageUrl = (req, filename) => {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/images/${filename}`;
};
