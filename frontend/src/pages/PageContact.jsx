const PageContact = () => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const name = event.target.name.value;
    const email = event.target.email.value;
    const message = event.target.message.value;

    if (name && email && message) {
      alert(`Terima kasih, ${name}! Pesan Anda telah diterima.`);
      event.target.reset();
    } else {
      alert("Harap lengkapi semua kolom.");
    }
  };

  return (
    <section className="py-10 px-4 md:px-8 lg:px-20  bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-6">
        <span className="text-blue-500">Contact</span>  <span className="text-white">Us</span>
      </h1>
      <div className="flex flex-col md:flex-row md:space-x-10 space-y-10 md:space-y-0">
        <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <h2 className="text-xl font-semibold mb-4">Hubungi Kami</h2>
          <p className="text-white mb-6">
            Untuk informasi lebih lanjut, anda bisa menghubungi kami:
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white">Nama</label>
              <input type="text" name="name" placeholder="Masukan Nama Anda" className="w-full p-3 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            <div>
              <label className="block text-white">Email</label>
              <input type="email" name="email" placeholder="email@gmail.com" className="w-full p-3 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            <div>
              <label className="block text-white">Pesan</label>
              <textarea name="message" placeholder="Ketik Pesan" className="w-full p-3 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"/>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-orange-600 transition duration-300">Submit</button>
          </form>
        </div>
        
        <div className="flex-1 bg-gray-800 p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Temui Kami Di</h2>
          <p className="text-white mb-2">
            Jl. Dr. KRT Radjiman Widyodiningrat No.32, RT.07/RW.7, Rawa Badung, Kec. Cakung, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13930
          </p>
          <p className="text-white mb-6">No. Telepon: 0813-8877-2645</p>
          <div className="map mb-4">
          <iframe 
           title="Map Location"
           src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.4342287584636!2d106.92306417402486!3d-6.206312860792983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698bcabb1368d7%3A0xea46dd080cc5e54c!2sSMK%20NEGERI%2069%20JAKARTA!5e0!3m2!1sid!2sid!4v1730899643322!5m2!1sid!2sid" 
           className="w-full h-48 md:h-64 lg:h-72 border-0 rounded-md"
           loading="lazy" 
           referrerPolicy="no-referrer-when-downgrade">
           </iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageContact;