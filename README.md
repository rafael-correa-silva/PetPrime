# 🐾 PetPrime

Site institucional para a **PetPrime**, pet shop fundado em 2010 em Guimarânia-MG, especializado em banho, tosa, banho+tosa e Táxi Pet.

**Slogan:** *"Cuidado & Qualidade para seu Pet"*

🔗 [Ver demo](#) <!-- substitua pelo link do GitHub Pages após o deploy -->

---

## 📋 Sobre o projeto

Site one-page totalmente responsivo, desenvolvido em **HTML, CSS e JavaScript puro** (sem frameworks ou bibliotecas externas), com foco em performance, acessibilidade e conversão via WhatsApp.

O agendamento é feito direto pelo formulário, que monta uma mensagem formatada e abre o WhatsApp automaticamente — sem necessidade de backend.

## ✨ Funcionalidades

- **Header fixo** com menu responsivo e hambúrguer animado
- **Hero** com CTA duplo e estatísticas da empresa
- **Seção Sobre Nós** com história, equipe e selo de tempo de atuação
- **4 serviços** detalhados: Banho, Tosa, Banho + Tosa e Táxi Pet
- **Formulário de agendamento** com validação em português e envio via WhatsApp
- **Depoimentos** de clientes com nota média de avaliação
- **FAQ** em accordion com 5 perguntas frequentes
- **Galeria de fotos** dos pets atendidos
- **Seção de contato** com endereço, horários e mapa do Google incorporado
- **Botão flutuante do WhatsApp** sempre visível
- **Banner de cookies (LGPD)** com persistência via `localStorage`
- **Páginas de Política de Privacidade e Termos de Uso**
- **Microinterações:** hover em cards, fade-in no scroll, pulse no WhatsApp
- **Lazy loading** de imagens
- **SEO básico:** meta tags, Open Graph e atributos `alt` descritivos

## 🛠️ Tecnologias

- HTML5 semântico
- CSS3 (Custom Properties, Grid, Flexbox, animações)
- JavaScript (Vanilla, sem dependências)
- Google Fonts: [Poppins](https://fonts.google.com/specimen/Poppins) + [Inter](https://fonts.google.com/specimen/Inter)

## 📁 Estrutura de pastas

```
petprime/
├── index.html              # Página principal
├── css/
│   └── style.css           # Estilos do site
├── js/
│   └── main.js              # Interações e validações
├── images/
│   ├── whatsapp.png
│   ├── instagram.jpg
│   └── gmail.jpg
└── pages/
    ├── privacidade.html     # Política de Privacidade (LGPD)
    └── termos.html           # Termos de Uso
```

## 🎨 Identidade visual

| Elemento | Valor |
|---|---|
| Dourado | `#C8860A` |
| Marrom | `#3E2723` |
| Bege | `#FFF8F0` |
| Tipografia (display) | Poppins |
| Tipografia (texto) | Inter |
| Elemento assinatura | 🐾 Patinha dourada |

## 🚀 Como rodar localmente

Não há build nem dependências — basta abrir o arquivo:

```bash
git clone https://github.com/seu-usuario/petprime.git
cd petprime
```

Abra o `index.html` direto no navegador, ou sirva com um servidor local (recomendado para evitar problemas de path):

```bash
# Python
python3 -m http.server 8000

# Node (http-server)
npx http-server
```

Depois acesse `http://localhost:8000`.

## 📞 Contato da empresa

- **WhatsApp/Telefone:** [(34) 99811-1439](https://wa.me/5534998111439)
- **E-mail:** rafaelcorsil2006@gmail.com
- **Instagram:** [@rafael_coorreea](https://instagram.com/rafael_coorreea)
- **Endereço:** Rua Tamoios, 1171 — Bairro Fronteira, Guimarânia-MG

**Horário de funcionamento:**
| Dia | Horário |
|---|---|
| Segunda a Sexta | 08h às 18h |
| Sábados | Fechado |
| Feriados | 08h às 12h |

## 📄 Licença

Este projeto foi desenvolvido para uso exclusivo da PetPrime. Todos os direitos de marca, conteúdo e identidade visual são reservados.

---

Feito com ❤️ para a PetPrime — Guimarânia-MG 🐾
