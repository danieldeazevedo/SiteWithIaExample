document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("previewImage").src = e.target.result;
            document.getElementById("previewImage").style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById("uploadForm").addEventListener("submit", async function(event) {
    event.preventDefault(); // Impede o recarregamento da página

    const formData = new FormData();
    const fileInput = document.getElementById("fileInput").files[0];

    if (!fileInput) {
        alert("Selecione uma imagem antes de enviar!");
        return;
    }

    formData.append("image", fileInput);

    // Ocultar imagem processada e exibir loading
    document.getElementById("outputImage").style.display = "none";
    document.getElementById("loading").style.display = "flex"; // Mostra o loading

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        if (response.ok) {
            setTimeout(() => {
                document.getElementById("outputImage").src = "/get-image?" + new Date().getTime();
                document.getElementById("outputImage").style.display = "block";
                document.getElementById("loading").style.display = "none"; // Esconde o loading
            }, 3000);
        } else {
            alert("Erro ao processar a imagem.");
            document.getElementById("loading").style.display = "none";
        }
    } catch (error) {
        console.error("Erro no upload:", error);
        alert("Erro no envio da imagem.");
        document.getElementById("loading").style.display = "none";
    }
});