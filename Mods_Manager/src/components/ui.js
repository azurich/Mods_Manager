// Utilitaires pour les classes CSS (inspiré de Shadcn UI)
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Variantes de composants utilisant class-variance-authority pattern
const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
};

const cardVariants = {
  variant: {
    default: "bg-card text-card-foreground border border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    success: "bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 border-green-200 dark:border-green-800",
  }
};

// Factory functions pour créer des composants
function createButton(options = {}) {
  const {
    variant = 'default',
    size = 'default',
    className = '',
    disabled = false,
    loading = false,
    children = '',
    onclick = null
  } = options;

  const button = document.createElement('button');
  
  const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variantClasses = buttonVariants.variant[variant];
  const sizeClasses = buttonVariants.size[size];
  
  button.className = cn(baseClasses, variantClasses, sizeClasses, className);
  button.disabled = disabled || loading;
  
  if (loading) {
    button.innerHTML = `
      <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      ${children}
    `;
  } else {
    button.innerHTML = children;
  }
  
  if (onclick) {
    button.addEventListener('click', onclick);
  }
  
  return button;
}

function createCard(options = {}) {
  const {
    variant = 'default',
    className = '',
    children = ''
  } = options;

  const card = document.createElement('div');
  const baseClasses = "rounded-lg shadow-sm";
  const variantClasses = cardVariants.variant[variant];
  
  card.className = cn(baseClasses, variantClasses, className);
  card.innerHTML = children;
  
  return card;
}

function createSelect(options = {}) {
  const {
    placeholder = 'Select an option...',
    className = '',
    onchange = null,
    options: selectOptions = []
  } = options;

  const select = document.createElement('select');
  const baseClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  
  select.className = cn(baseClasses, className);
  
  // Ajouter l'option placeholder
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);
  
  // Ajouter les options
  selectOptions.forEach(option => {
    const optionElement = document.createElement('option');
    optionElement.value = option.value;
    optionElement.textContent = option.label;
    if (option.dataset) {
      Object.keys(option.dataset).forEach(key => {
        optionElement.dataset[key] = option.dataset[key];
      });
    }
    select.appendChild(optionElement);
  });
  
  if (onchange) {
    select.addEventListener('change', onchange);
  }
  
  return select;
}

function createProgressBar(options = {}) {
  const {
    value = 0,
    className = '',
    showLabel = true
  } = options;

  const container = document.createElement('div');
  container.className = 'space-y-2';
  
  if (showLabel) {
    const label = document.createElement('div');
    label.className = 'flex justify-between text-sm text-muted-foreground';
    label.innerHTML = `
      <span>Progression</span>
      <span class="progress-percentage">${value}%</span>
    `;
    container.appendChild(label);
  }
  
  const progressContainer = document.createElement('div');
  progressContainer.className = cn('w-full bg-secondary rounded-full h-2.5', className);
  
  const progressBar = document.createElement('div');
  progressBar.className = 'bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out relative overflow-hidden';
  progressBar.style.width = `${value}%`;
  
  // Ajouter l'effet de brillance animé
  const shine = document.createElement('div');
  shine.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-progress';
  progressBar.appendChild(shine);
  
  progressContainer.appendChild(progressBar);
  container.appendChild(progressContainer);
  
  // Méthode pour mettre à jour la progression
  container.updateProgress = function(newValue) {
    progressBar.style.width = `${newValue}%`;
    if (showLabel) {
      container.querySelector('.progress-percentage').textContent = `${newValue}%`;
    }
  };
  
  return container;
}

function createConsole(options = {}) {
  const {
    className = '',
    placeholder = 'Console output will appear here...'
  } = options;

  const consoleContainer = document.createElement('div');
  consoleContainer.className = cn(
    'bg-background border border-border rounded-lg p-4 font-mono text-sm h-full overflow-auto',
    'scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent',
    className
  );
  
  // Ajouter le placeholder initial
  if (placeholder) {
    const placeholderElement = document.createElement('div');
    placeholderElement.className = 'text-muted-foreground italic';
    placeholderElement.textContent = placeholder;
    consoleContainer.appendChild(placeholderElement);
  }
  
  // Méthode pour ajouter des logs
  consoleContainer.log = function(message, type = 'info') {
    // Supprimer le placeholder si c'est le premier log
    if (consoleContainer.querySelector('.text-muted-foreground.italic')) {
      consoleContainer.innerHTML = '';
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const logElement = document.createElement('div');
    
    const typeClasses = {
      info: 'text-foreground',
      success: 'text-green-600 dark:text-green-400',
      error: 'text-destructive',
      warning: 'text-yellow-600 dark:text-yellow-400'
    };
    
    logElement.className = cn('py-1 animate-fade-in', typeClasses[type] || typeClasses.info);
    logElement.innerHTML = `<span class="text-muted-foreground">[${timestamp}]</span> ${message}`;
    
    consoleContainer.appendChild(logElement);
    consoleContainer.scrollTop = consoleContainer.scrollHeight;
  };
  
  // Méthode pour vider la console
  consoleContainer.clear = function() {
    consoleContainer.innerHTML = '';
    if (placeholder) {
      const placeholderElement = document.createElement('div');
      placeholderElement.className = 'text-muted-foreground italic';
      placeholderElement.textContent = placeholder;
      consoleContainer.appendChild(placeholderElement);
    }
  };
  
  return consoleContainer;
}

// Utilitaires pour les toasts/notifications
function createToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  
  const typeClasses = {
    info: 'bg-primary text-primary-foreground',
    success: 'bg-green-600 text-white',
    error: 'bg-destructive text-destructive-foreground',
    warning: 'bg-yellow-600 text-white'
  };
  
  toast.className = cn(
    'fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50',
    'animate-slide-up',
    typeClasses[type] || typeClasses.info
  );
  
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  return toast;
}

// Export des utilitaires
window.UI = {
  cn,
  createButton,
  createCard,
  createSelect,
  createProgressBar,
  createConsole,
  createToast,
  buttonVariants,
  cardVariants
};